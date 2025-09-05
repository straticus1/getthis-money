#!/bin/bash

# GetThis.Money Frontend Deployment Script
# This script builds and deploys the React frontend to S3 and invalidates CloudFront cache

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
AWS_REGION="us-east-1"
S3_BUCKET="getthis-money-prod-frontend"
DISTRIBUTION_ID=""  # Will be fetched from CloudFront

echo -e "${GREEN}Starting GetThis.Money Frontend Deployment${NC}"

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo -e "${RED}AWS CLI is not installed. Please install it first.${NC}"
    exit 1
fi

# Check if Node.js and npm are installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}npm is not installed. Please install Node.js and npm first.${NC}"
    exit 1
fi

# Get CloudFront Distribution ID
echo -e "${YELLOW}Getting CloudFront Distribution ID...${NC}"
DISTRIBUTION_ID=$(aws cloudfront list-distributions \
    --query "DistributionList.Items[?Comment=='CloudFront distribution for getthis-money-prod frontend'].Id" \
    --output text \
    --region ${AWS_REGION})

if [ -z "$DISTRIBUTION_ID" ] || [ "$DISTRIBUTION_ID" == "None" ]; then
    echo -e "${RED}Could not find CloudFront distribution. Please make sure the infrastructure is deployed.${NC}"
    exit 1
fi

echo -e "${YELLOW}CloudFront Distribution ID: ${DISTRIBUTION_ID}${NC}"
echo -e "${YELLOW}S3 Bucket: ${S3_BUCKET}${NC}"

# Install dependencies
echo -e "${YELLOW}Installing dependencies...${NC}"
npm install --legacy-peer-deps

# Set production environment variables
export REACT_APP_API_URL="https://api.getthis.money/api"
export REACT_APP_NODE_ENV="production"
export REACT_APP_ENABLE_ANALYTICS="true"
export REACT_APP_ENABLE_SOCIAL_SHARING="true"
export REACT_APP_ENABLE_PWA="true"
export GENERATE_SOURCEMAP="false"

echo -e "${YELLOW}Building React application for production...${NC}"
npm run build

# Verify build directory exists
if [ ! -d "build" ]; then
    echo -e "${RED}Build directory not found. Build may have failed.${NC}"
    exit 1
fi

# Sync build files to S3
echo -e "${YELLOW}Uploading files to S3...${NC}"

# Upload static assets with long cache headers
aws s3 sync build/static/ s3://${S3_BUCKET}/static/ \
    --region ${AWS_REGION} \
    --cache-control "public, max-age=31536000, immutable" \
    --delete

# Upload other files with shorter cache headers
aws s3 sync build/ s3://${S3_BUCKET}/ \
    --region ${AWS_REGION} \
    --cache-control "public, max-age=3600" \
    --exclude "static/*" \
    --delete

# Upload index.html with no cache (for SPA routing)
aws s3 cp build/index.html s3://${S3_BUCKET}/index.html \
    --region ${AWS_REGION} \
    --cache-control "no-cache, no-store, must-revalidate"

# Create CloudFront invalidation
echo -e "${YELLOW}Creating CloudFront invalidation...${NC}"
INVALIDATION_ID=$(aws cloudfront create-invalidation \
    --distribution-id ${DISTRIBUTION_ID} \
    --paths "/*" \
    --query 'Invalidation.Id' \
    --output text \
    --region ${AWS_REGION})

echo -e "${YELLOW}Invalidation ID: ${INVALIDATION_ID}${NC}"
echo -e "${YELLOW}Waiting for invalidation to complete...${NC}"

# Wait for invalidation to complete (optional, can take 10-15 minutes)
aws cloudfront wait invalidation-completed \
    --distribution-id ${DISTRIBUTION_ID} \
    --id ${INVALIDATION_ID} \
    --region ${AWS_REGION}

echo -e "${GREEN}Frontend deployment completed successfully!${NC}"
echo -e "${GREEN}Your application should be available at: https://getthis.money${NC}"

# Show CloudFront distribution info
echo -e "${YELLOW}CloudFront Distribution Info:${NC}"
aws cloudfront get-distribution \
    --id ${DISTRIBUTION_ID} \
    --query 'Distribution.{DomainName:DomainName,Status:Status,LastModifiedTime:LastModifiedTime}' \
    --output table \
    --region ${AWS_REGION}

echo -e "${YELLOW}Cache invalidation status:${NC}"
aws cloudfront get-invalidation \
    --distribution-id ${DISTRIBUTION_ID} \
    --id ${INVALIDATION_ID} \
    --query 'Invalidation.{Status:Status,CreateTime:CreateTime}' \
    --output table \
    --region ${AWS_REGION}
