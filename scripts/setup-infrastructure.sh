#!/bin/bash

# GetThis.Money Infrastructure Setup Script
# This script sets up the Terraform backend and deploys the infrastructure

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
AWS_REGION="us-east-1"
TERRAFORM_STATE_BUCKET="getthis-money-terraform-state"
TERRAFORM_LOCK_TABLE="getthis-money-terraform-locks"

echo -e "${GREEN}Starting GetThis.Money Infrastructure Setup${NC}"

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo -e "${RED}AWS CLI is not installed. Please install it first.${NC}"
    exit 1
fi

# Check if Terraform is installed
if ! command -v terraform &> /dev/null; then
    echo -e "${RED}Terraform is not installed. Please install it first.${NC}"
    exit 1
fi

# Verify AWS credentials
echo -e "${YELLOW}Verifying AWS credentials...${NC}"
if ! aws sts get-caller-identity > /dev/null 2>&1; then
    echo -e "${RED}AWS credentials not configured. Please run 'aws configure' first.${NC}"
    exit 1
fi

AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo -e "${YELLOW}AWS Account ID: ${AWS_ACCOUNT_ID}${NC}"

# Create S3 bucket for Terraform state
echo -e "${YELLOW}Setting up Terraform backend...${NC}"

# Check if bucket exists
if aws s3 ls "s3://${TERRAFORM_STATE_BUCKET}" 2>&1 | grep -q 'NoSuchBucket'; then
    echo -e "${YELLOW}Creating S3 bucket for Terraform state...${NC}"
    
    if [ "$AWS_REGION" == "us-east-1" ]; then
        aws s3 mb s3://${TERRAFORM_STATE_BUCKET} --region ${AWS_REGION}
    else
        aws s3 mb s3://${TERRAFORM_STATE_BUCKET} --region ${AWS_REGION} --create-bucket-configuration LocationConstraint=${AWS_REGION}
    fi
    
    # Enable versioning
    aws s3api put-bucket-versioning \
        --bucket ${TERRAFORM_STATE_BUCKET} \
        --versioning-configuration Status=Enabled
    
    # Enable encryption
    aws s3api put-bucket-encryption \
        --bucket ${TERRAFORM_STATE_BUCKET} \
        --server-side-encryption-configuration '{
            "Rules": [
                {
                    "ApplyServerSideEncryptionByDefault": {
                        "SSEAlgorithm": "AES256"
                    }
                }
            ]
        }'
    
    # Block public access
    aws s3api put-public-access-block \
        --bucket ${TERRAFORM_STATE_BUCKET} \
        --public-access-block-configuration \
        BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true
else
    echo -e "${GREEN}S3 bucket already exists: ${TERRAFORM_STATE_BUCKET}${NC}"
fi

# Create DynamoDB table for state locking
echo -e "${YELLOW}Setting up DynamoDB table for state locking...${NC}"

if aws dynamodb describe-table --table-name ${TERRAFORM_LOCK_TABLE} --region ${AWS_REGION} > /dev/null 2>&1; then
    echo -e "${GREEN}DynamoDB table already exists: ${TERRAFORM_LOCK_TABLE}${NC}"
else
    echo -e "${YELLOW}Creating DynamoDB table for state locking...${NC}"
    aws dynamodb create-table \
        --table-name ${TERRAFORM_LOCK_TABLE} \
        --attribute-definitions AttributeName=LockID,AttributeType=S \
        --key-schema AttributeName=LockID,KeyType=HASH \
        --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 \
        --region ${AWS_REGION}
    
    # Wait for table to be active
    echo -e "${YELLOW}Waiting for DynamoDB table to become active...${NC}"
    aws dynamodb wait table-exists --table-name ${TERRAFORM_LOCK_TABLE} --region ${AWS_REGION}
fi

# Navigate to terraform directory
cd terraform

# Check if terraform.tfvars exists
if [ ! -f "terraform.tfvars" ]; then
    echo -e "${YELLOW}Creating terraform.tfvars from example...${NC}"
    cp terraform.tfvars.example terraform.tfvars
    
    echo -e "${RED}Please edit terraform.tfvars and set your DocumentDB password:${NC}"
    echo -e "${YELLOW}Required: documentdb_master_password${NC}"
    echo ""
    read -p "Press enter to continue after editing terraform.tfvars..."
fi

# Initialize Terraform
echo -e "${YELLOW}Initializing Terraform...${NC}"
terraform init

# Validate Terraform configuration
echo -e "${YELLOW}Validating Terraform configuration...${NC}"
terraform validate

# Plan the deployment
echo -e "${YELLOW}Planning Terraform deployment...${NC}"
terraform plan -out=tfplan

# Ask for confirmation
echo ""
echo -e "${YELLOW}Do you want to apply the Terraform plan? (y/N)${NC}"
read -r response
if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    echo -e "${YELLOW}Applying Terraform configuration...${NC}"
    terraform apply tfplan
    
    echo -e "${GREEN}Infrastructure deployment completed!${NC}"
    echo ""
    echo -e "${YELLOW}Next steps:${NC}"
    echo "1. Note the Route53 name servers from the output above"
    echo "2. Update your domain registrar to use these name servers"
    echo "3. Wait for DNS propagation (can take up to 48 hours)"
    echo "4. Store your secrets in AWS Systems Manager Parameter Store:"
    echo "   - /getthis-money/prod/jwt-secret"
    echo "   - /getthis-money/prod/session-secret"
    echo "   - /getthis-money/prod/google-client-id"
    echo "   - /getthis-money/prod/google-client-secret"
    echo "   - /getthis-money/prod/github-client-id"
    echo "   - /getthis-money/prod/github-client-secret"
    echo "   - /getthis-money/prod/facebook-client-id"
    echo "   - /getthis-money/prod/facebook-client-secret"
    echo "5. Deploy your backend: ../scripts/deploy-backend.sh"
    echo "6. Deploy your frontend: ../scripts/deploy-frontend.sh"
    echo ""
    
    # Show the DNS servers
    echo -e "${GREEN}DNS Name Servers:${NC}"
    terraform output route53_name_servers
    
else
    echo -e "${YELLOW}Deployment cancelled.${NC}"
    rm -f tfplan
fi
