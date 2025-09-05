# Route53 Outputs (DNS Servers)
output "route53_name_servers" {
  description = "Authoritative DNS servers for the domain - Point your domain registrar to these"
  value       = module.route53.name_servers
}

output "route53_zone_id" {
  description = "Route53 hosted zone ID"
  value       = module.route53.zone_id
}

# Application URLs
output "frontend_url" {
  description = "Frontend URL (CloudFront distribution)"
  value       = "https://${var.domain_name}"
}

output "api_url" {
  description = "API URL (Application Load Balancer)"
  value       = "https://api.${var.domain_name}"
}

# Infrastructure Details
output "vpc_id" {
  description = "ID of the VPC"
  value       = module.vpc.vpc_id
}

output "ecr_repository_url" {
  description = "ECR repository URL for pushing Docker images"
  value       = module.ecr.repository_url
}

output "documentdb_cluster_endpoint" {
  description = "DocumentDB cluster endpoint"
  value       = module.documentdb.cluster_endpoint
  sensitive   = true
}

output "alb_dns_name" {
  description = "ALB DNS name"
  value       = module.alb.dns_name
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID"
  value       = module.s3_cloudfront.distribution_id
}

output "s3_bucket_name" {
  description = "S3 bucket name for frontend"
  value       = module.s3_cloudfront.bucket_name
}
