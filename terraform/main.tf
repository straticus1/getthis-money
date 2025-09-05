terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  
  backend "s3" {
    bucket         = "getthis-money-terraform-state"
    key            = "prod/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "getthis-money-terraform-locks"
  }
}

provider "aws" {
  region = var.aws_region
  
  default_tags {
    tags = {
      Project     = "GetThis.Money"
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}

# Provider for CloudFront certificates (must be in us-east-1)
provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"
  
  default_tags {
    tags = {
      Project     = "GetThis.Money"
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}

# Data sources
data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_caller_identity" "current" {}

# Local values
locals {
  name_prefix = "${var.project_name}-${var.environment}"
  common_tags = {
    Project     = var.project_name
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}

# Route53 hosted zone (this will give you the authoritative DNS servers)
module "route53" {
  source = "./modules/route53"
  
  domain_name = var.domain_name
  environment = var.environment
  
  tags = local.common_tags
}

# VPC and networking
module "vpc" {
  source = "./modules/vpc"
  
  name_prefix        = local.name_prefix
  vpc_cidr          = var.vpc_cidr
  availability_zones = data.aws_availability_zones.available.names
  
  tags = local.common_tags
}

# IAM roles
module "iam" {
  source = "./modules/iam"
  
  name_prefix = local.name_prefix
  
  tags = local.common_tags
}

# ECR repository
module "ecr" {
  source = "./modules/ecr"
  
  name_prefix = local.name_prefix
  
  tags = local.common_tags
}

# Application Load Balancer
module "alb" {
  source = "./modules/alb"
  
  name_prefix    = local.name_prefix
  vpc_id         = module.vpc.vpc_id
  public_subnets = module.vpc.public_subnets
  domain_name    = var.domain_name
  zone_id        = module.route53.zone_id
  
  tags = local.common_tags
}

# DocumentDB cluster
module "documentdb" {
  source = "./modules/documentdb"
  
  name_prefix     = local.name_prefix
  vpc_id          = module.vpc.vpc_id
  private_subnets = module.vpc.private_subnets
  
  master_username = var.documentdb_master_username
  master_password = var.documentdb_master_password
  
  tags = local.common_tags
}

# ECS Fargate cluster
module "ecs" {
  source = "./modules/ecs"
  
  name_prefix     = local.name_prefix
  vpc_id          = module.vpc.vpc_id
  private_subnets = module.vpc.private_subnets
  
  alb_target_group_arn = module.alb.target_group_arn
  alb_security_group_id = module.alb.security_group_id
  
  ecr_repository_url = module.ecr.repository_url
  task_role_arn      = module.iam.ecs_task_role_arn
  execution_role_arn = module.iam.ecs_execution_role_arn
  
  # Environment variables for the backend
  environment_vars = [
    {
      name  = "NODE_ENV"
      value = "production"
    },
    {
      name  = "PORT"
      value = "5000"
    },
    {
      name  = "CLIENT_URL"
      value = "https://${var.domain_name}"
    },
    {
      name  = "MONGODB_URI"
      value = "mongodb://${var.documentdb_master_username}:${var.documentdb_master_password}@${module.documentdb.cluster_endpoint}:27017/getthis-money?ssl=true&replicaSet=rs0&readPreference=secondaryPreferred&retryWrites=false"
    }
  ]
  
  # Secrets (will be stored in AWS Systems Manager Parameter Store)
  secrets = [
    {
      name      = "JWT_SECRET"
      valueFrom = "/getthis-money/prod/jwt-secret"
    },
    {
      name      = "SESSION_SECRET"
      valueFrom = "/getthis-money/prod/session-secret"
    },
    {
      name      = "GOOGLE_CLIENT_ID"
      valueFrom = "/getthis-money/prod/google-client-id"
    },
    {
      name      = "GOOGLE_CLIENT_SECRET"
      valueFrom = "/getthis-money/prod/google-client-secret"
    },
    {
      name      = "GITHUB_CLIENT_ID"
      valueFrom = "/getthis-money/prod/github-client-id"
    },
    {
      name      = "GITHUB_CLIENT_SECRET"
      valueFrom = "/getthis-money/prod/github-client-secret"
    },
    {
      name      = "FACEBOOK_CLIENT_ID"
      valueFrom = "/getthis-money/prod/facebook-client-id"
    },
    {
      name      = "FACEBOOK_CLIENT_SECRET"
      valueFrom = "/getthis-money/prod/facebook-client-secret"
    }
  ]
  
  tags = local.common_tags
}

# S3 and CloudFront for frontend
module "s3_cloudfront" {
  source = "./modules/s3-cloudfront"
  
  providers = {
    aws.us_east_1 = aws.us_east_1
  }
  
  name_prefix = local.name_prefix
  domain_name = var.domain_name
  zone_id     = module.route53.zone_id
  
  tags = local.common_tags
}
