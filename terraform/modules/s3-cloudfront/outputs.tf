output "bucket_name" {
  description = "S3 bucket name"
  value       = aws_s3_bucket.frontend.id
}

output "bucket_arn" {
  description = "S3 bucket ARN"
  value       = aws_s3_bucket.frontend.arn
}

output "bucket_domain_name" {
  description = "S3 bucket domain name"
  value       = aws_s3_bucket.frontend.bucket_domain_name
}

output "distribution_id" {
  description = "CloudFront distribution ID"
  value       = aws_cloudfront_distribution.frontend.id
}

output "distribution_arn" {
  description = "CloudFront distribution ARN"
  value       = aws_cloudfront_distribution.frontend.arn
}

output "distribution_domain_name" {
  description = "CloudFront distribution domain name"
  value       = aws_cloudfront_distribution.frontend.domain_name
}

output "distribution_hosted_zone_id" {
  description = "CloudFront distribution hosted zone ID"
  value       = aws_cloudfront_distribution.frontend.hosted_zone_id
}

output "origin_access_control_id" {
  description = "CloudFront Origin Access Control ID"
  value       = aws_cloudfront_origin_access_control.frontend.id
}

output "certificate_arn" {
  description = "ACM certificate ARN for CloudFront"
  value       = aws_acm_certificate_validation.cloudfront.certificate_arn
}
