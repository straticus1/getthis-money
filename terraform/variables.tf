variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "prod"
}

variable "project_name" {
  description = "Project name"
  type        = string
  default     = "getthis-money"
}

variable "domain_name" {
  description = "Domain name for the application"
  type        = string
  default     = "getthis.money"
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "documentdb_master_username" {
  description = "Master username for DocumentDB cluster"
  type        = string
  default     = "getthismoney"
  sensitive   = true
}

variable "documentdb_master_password" {
  description = "Master password for DocumentDB cluster"
  type        = string
  sensitive   = true
}

variable "ssl_certificate_arn" {
  description = "ARN of SSL certificate for HTTPS (optional - will be created if not provided)"
  type        = string
  default     = ""
}
