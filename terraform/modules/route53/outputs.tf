output "zone_id" {
  description = "Route53 hosted zone ID"
  value       = aws_route53_zone.main.zone_id
}

output "name_servers" {
  description = "Authoritative name servers for the domain"
  value       = aws_route53_zone.main.name_servers
}

output "zone_arn" {
  description = "Route53 hosted zone ARN"
  value       = aws_route53_zone.main.arn
}

output "health_check_id" {
  description = "Health check ID"
  value       = aws_route53_health_check.main.id
}
