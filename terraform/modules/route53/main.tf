# Route53 hosted zone
resource "aws_route53_zone" "main" {
  name = var.domain_name

  tags = merge(var.tags, {
    Name = "${var.domain_name}-hosted-zone"
  })
}

# Health check for the main domain
resource "aws_route53_health_check" "main" {
  fqdn                            = var.domain_name
  port                           = 443
  type                           = "HTTPS"
  resource_path                  = "/"
  failure_threshold              = "3"
  request_interval               = "30"
  cloudwatch_logs_region         = "us-east-1"
  cloudwatch_alarm_region        = "us-east-1"
  insufficient_data_health_status = "Failure"

  tags = merge(var.tags, {
    Name = "${var.domain_name}-health-check"
  })
}
