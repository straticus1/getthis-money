#!/bin/bash

# GetThis.Money Backend Deployment Script
# This script builds and deploys the backend Docker image to AWS ECR and updates ECS service

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
AWS_REGION="us-east-1"
IMAGE_TAG=${1:-"latest"}
ECR_REPOSITORY_NAME="getthis-money-prod-backend"

echo -e "${GREEN}Starting GetThis.Money Backend Deployment${NC}"

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo -e "${RED}AWS CLI is not installed. Please install it first.${NC}"
    exit 1
fi

# Check if Docker is installed and running
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Docker is not installed. Please install it first.${NC}"
    exit 1
fi

if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}Docker is not running. Please start Docker first.${NC}"
    exit 1
fi

# Get AWS account ID
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ECR_URI="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPOSITORY_NAME}"

echo -e "${YELLOW}AWS Account ID: ${AWS_ACCOUNT_ID}${NC}"
echo -e "${YELLOW}ECR Repository URI: ${ECR_URI}${NC}"
echo -e "${YELLOW}Image Tag: ${IMAGE_TAG}${NC}"

# Authenticate Docker to ECR
echo -e "${YELLOW}Authenticating Docker with ECR...${NC}"
aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com

# Build Docker image
echo -e "${YELLOW}Building Docker image...${NC}"
docker build -t ${ECR_REPOSITORY_NAME}:${IMAGE_TAG} .

# Tag the image for ECR
echo -e "${YELLOW}Tagging Docker image for ECR...${NC}"
docker tag ${ECR_REPOSITORY_NAME}:${IMAGE_TAG} ${ECR_URI}:${IMAGE_TAG}
docker tag ${ECR_REPOSITORY_NAME}:${IMAGE_TAG} ${ECR_URI}:latest

# Push image to ECR
echo -e "${YELLOW}Pushing Docker image to ECR...${NC}"
docker push ${ECR_URI}:${IMAGE_TAG}
docker push ${ECR_URI}:latest

# Update ECS service to use the new image
echo -e "${YELLOW}Updating ECS service...${NC}"
CLUSTER_NAME="getthis-money-prod-cluster"
SERVICE_NAME="getthis-money-prod-service"

# Force new deployment
aws ecs update-service \
    --region ${AWS_REGION} \
    --cluster ${CLUSTER_NAME} \
    --service ${SERVICE_NAME} \
    --force-new-deployment \
    --query 'service.serviceName' \
    --output text

echo -e "${GREEN}Waiting for ECS service to stabilize...${NC}"
aws ecs wait services-stable \
    --region ${AWS_REGION} \
    --cluster ${CLUSTER_NAME} \
    --services ${SERVICE_NAME}

echo -e "${GREEN}Backend deployment completed successfully!${NC}"
echo -e "${YELLOW}You can check the service status with:${NC}"
echo "aws ecs describe-services --region ${AWS_REGION} --cluster ${CLUSTER_NAME} --services ${SERVICE_NAME}"

# Optional: Show running tasks
echo -e "${YELLOW}Current running tasks:${NC}"
aws ecs list-tasks \
    --region ${AWS_REGION} \
    --cluster ${CLUSTER_NAME} \
    --service-name ${SERVICE_NAME} \
    --query 'taskArns' \
    --output table
