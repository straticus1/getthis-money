# GetThis.Money - AWS Deployment Guide

This guide will help you deploy the GetThis.Money application to AWS using Terraform, including the complete infrastructure setup with Route53 DNS management.

## 🏗️ Architecture Overview

The AWS infrastructure includes:

- **Route53**: DNS management and hosted zone
- **CloudFront**: Global CDN for the React frontend
- **S3**: Static website hosting for React build files
- **Application Load Balancer (ALB)**: HTTPS termination and load balancing
- **ECS Fargate**: Containerized Node.js backend
- **DocumentDB**: MongoDB-compatible database
- **ECR**: Docker image registry
- **VPC**: Isolated network environment
- **ACM**: SSL/TLS certificates

## 📋 Prerequisites

### Required Tools

1. **AWS CLI** (v2.0+)
   ```bash
   # macOS
   brew install awscli
   
   # Linux
   curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
   unzip awscliv2.zip
   sudo ./aws/install
   ```

2. **Terraform** (v1.0+)
   ```bash
   # macOS
   brew install terraform
   
   # Linux
   wget https://releases.hashicorp.com/terraform/1.6.0/terraform_1.6.0_linux_amd64.zip
   unzip terraform_1.6.0_linux_amd64.zip
   sudo mv terraform /usr/local/bin/
   ```

3. **Docker** (for building backend images)
   - Install Docker Desktop or Docker Engine

4. **Node.js and npm** (for frontend builds)
   - Node.js 16+ and npm

### AWS Setup

1. **AWS Account**: Ensure you have an AWS account with appropriate permissions
2. **Domain**: You should own the domain `getthis.money`
3. **AWS Credentials**: Configure AWS CLI with your credentials
   ```bash
   aws configure
   ```

## 🚀 Deployment Steps

### Step 1: Infrastructure Setup

1. **Run the infrastructure setup script:**
   ```bash
   ./scripts/setup-infrastructure.sh
   ```

   This script will:
   - Create S3 bucket for Terraform state
   - Create DynamoDB table for state locking
   - Initialize Terraform
   - Deploy the complete infrastructure

2. **Set DocumentDB Password**:
   When prompted, edit `terraform/terraform.tfvars` and add:
   ```hcl
   documentdb_master_password = "YourSecurePassword123!"
   ```

3. **Review and Apply**:
   The script will show a Terraform plan. Review it and type 'y' to proceed.

### Step 2: DNS Configuration

After the infrastructure is deployed, you'll see output like:

```
route53_name_servers = [
  "ns-1234.awsdns-12.org",
  "ns-5678.awsdns-34.net",
  "ns-9012.awsdns-56.com",
  "ns-3456.awsdns-78.co.uk"
]
```

**Update your domain registrar** to use these name servers for `getthis.money`.

### Step 3: Configure Application Secrets

Store your OAuth and JWT secrets in AWS Systems Manager Parameter Store:

```bash
# JWT and Session secrets
aws ssm put-parameter \
  --name "/getthis-money/prod/jwt-secret" \
  --value "your-super-secure-jwt-secret-here" \
  --type "SecureString"

aws ssm put-parameter \
  --name "/getthis-money/prod/session-secret" \
  --value "your-super-secure-session-secret-here" \
  --type "SecureString"

# OAuth credentials
aws ssm put-parameter \
  --name "/getthis-money/prod/google-client-id" \
  --value "your-google-client-id" \
  --type "SecureString"

aws ssm put-parameter \
  --name "/getthis-money/prod/google-client-secret" \
  --value "your-google-client-secret" \
  --type "SecureString"

# Add GitHub and Facebook credentials similarly...
```

### Step 4: Add Health Check Endpoint

Add a health check endpoint to your backend server (`server/server.js`):

```javascript
// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0'
  });
});
```

### Step 5: Deploy Backend

1. **Build and push Docker image:**
   ```bash
   ./scripts/deploy-backend.sh
   ```

   This script will:
   - Build Docker image from your code
   - Push to ECR
   - Update ECS service
   - Wait for deployment to complete

### Step 6: Deploy Frontend

1. **Build and deploy React app:**
   ```bash
   ./scripts/deploy-frontend.sh
   ```

   This script will:
   - Build React app for production
   - Upload to S3
   - Invalidate CloudFront cache
   - Configure proper caching headers

## 🔒 Security Configuration

### OAuth Setup

Update your OAuth applications to use the new domains:

1. **Google OAuth**:
   - Authorized JavaScript origins: `https://getthis.money`
   - Authorized redirect URIs: `https://api.getthis.money/api/auth/google/callback`

2. **GitHub OAuth**:
   - Homepage URL: `https://getthis.money`
   - Authorization callback URL: `https://api.getthis.money/api/auth/github/callback`

3. **Facebook OAuth**:
   - App Domains: `getthis.money`
   - Valid OAuth Redirect URIs: `https://api.getthis.money/api/auth/facebook/callback`

## 📊 Monitoring and Logs

### CloudWatch Logs

- **ECS Application Logs**: `/aws/ecs/getthis-money-prod-app`
- **ECS Exec Logs**: `/aws/ecs/getthis-money-prod-exec`
- **DocumentDB Audit Logs**: `/aws/docdb/getthis-money-prod-docdb-cluster/audit`

### Monitoring Commands

```bash
# Check ECS service status
aws ecs describe-services \
  --cluster getthis-money-prod-cluster \
  --services getthis-money-prod-service

# View recent logs
aws logs tail /aws/ecs/getthis-money-prod-app --follow

# Check CloudFront distribution status
aws cloudfront list-distributions \
  --query "DistributionList.Items[?Comment=='CloudFront distribution for getthis-money-prod frontend']"
```

## 🛠️ Maintenance

### Updating Backend

```bash
# Deploy new backend version
./scripts/deploy-backend.sh v1.1.0

# Rollback if needed
aws ecs update-service \
  --cluster getthis-money-prod-cluster \
  --service getthis-money-prod-service \
  --task-definition getthis-money-prod-app:PREVIOUS_REVISION
```

### Updating Frontend

```bash
# Deploy frontend changes
./scripts/deploy-frontend.sh
```

### Infrastructure Updates

```bash
cd terraform
terraform plan
terraform apply
```

## 💰 Cost Optimization

The infrastructure is designed to be cost-effective:

- **ECS Fargate**: Auto-scaling based on CPU/memory usage
- **DocumentDB**: t3.medium instances (can scale down for development)
- **S3**: Standard storage with intelligent tiering
- **CloudFront**: Pay-as-you-go CDN
- **VPC Endpoints**: Reduce NAT Gateway costs for S3/DynamoDB access

### Estimated Monthly Costs (US East 1)

- **ECS Fargate**: ~$30-60 (2 tasks, 0.5 vCPU, 1GB RAM each)
- **DocumentDB**: ~$90-120 (2x t3.medium instances)
- **Application Load Balancer**: ~$20
- **CloudFront**: ~$1-10 (depending on traffic)
- **S3**: ~$1-5 (depending on storage and requests)
- **Route53**: ~$0.50 (hosted zone)
- **Data Transfer**: Variable based on usage

**Total estimated: $140-220/month**

## 🚨 Troubleshooting

### Common Issues

1. **Certificate Validation Failing**:
   - Ensure DNS is properly configured
   - Check Route53 records are created

2. **ECS Service Not Starting**:
   - Check CloudWatch logs for container errors
   - Verify environment variables and secrets

3. **DocumentDB Connection Issues**:
   - Ensure security groups allow port 27017
   - Verify VPC configuration

4. **Frontend Not Loading**:
   - Check CloudFront distribution status
   - Verify S3 bucket policy and CORS

### Getting Help

```bash
# Check Terraform state
cd terraform
terraform show

# Get resource details
terraform state list
terraform state show module.route53.aws_route53_zone.main

# Debug ECS tasks
aws ecs describe-tasks --cluster getthis-money-prod-cluster --tasks TASK-ID
```

## 🔄 Backup and Recovery

### Database Backups

DocumentDB automatically creates daily backups with 7-day retention. For longer retention:

```bash
# Create manual snapshot
aws docdb create-db-cluster-snapshot \
  --cluster-identifier getthis-money-prod-docdb-cluster \
  --snapshot-identifier getthis-money-manual-backup-$(date +%Y%m%d)
```

### Infrastructure Backup

Terraform state is stored in S3 with versioning enabled. You can restore previous versions if needed.

## 🎯 Next Steps

After successful deployment:

1. Set up monitoring alerts in CloudWatch
2. Configure log aggregation (optional)
3. Set up CI/CD pipelines (GitHub Actions recommended)
4. Configure backup policies
5. Set up performance monitoring (New Relic, DataDog, etc.)

---

## 📞 Support

For deployment issues:
1. Check CloudWatch logs first
2. Review Terraform outputs
3. Verify DNS propagation status
4. Check security group configurations

**Author**: Ryan Coleman <coleman.ryan@gmail.com>

The infrastructure is now ready for production use with automatic scaling, SSL certificates, and monitoring capabilities!
