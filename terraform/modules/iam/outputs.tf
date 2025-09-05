output "ecs_execution_role_arn" {
  description = "ARN of the ECS execution role"
  value       = aws_iam_role.ecs_execution_role.arn
}

output "ecs_task_role_arn" {
  description = "ARN of the ECS task role"
  value       = aws_iam_role.ecs_task_role.arn
}

output "cloudfront_oac_role_arn" {
  description = "ARN of the CloudFront OAC role"
  value       = aws_iam_role.cloudfront_oac_role.arn
}

output "s3_cloudfront_policy_arn" {
  description = "ARN of the S3 CloudFront policy"
  value       = aws_iam_policy.s3_cloudfront_policy.arn
}
