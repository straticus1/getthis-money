output "load_balancer_arn" {
  description = "ARN of the load balancer"
  value       = aws_lb.main.arn
}

output "load_balancer_dns_name" {
  description = "DNS name of the load balancer"
  value       = aws_lb.main.dns_name
}

output "dns_name" {
  description = "DNS name of the load balancer"
  value       = aws_lb.main.dns_name
}

output "zone_id" {
  description = "Zone ID of the load balancer"
  value       = aws_lb.main.zone_id
}

output "target_group_arn" {
  description = "ARN of the target group"
  value       = aws_lb_target_group.api.arn
}

output "security_group_id" {
  description = "Security group ID of the ALB"
  value       = aws_security_group.alb.id
}

output "certificate_arn" {
  description = "ARN of the ACM certificate"
  value       = aws_acm_certificate_validation.main.certificate_arn
}
