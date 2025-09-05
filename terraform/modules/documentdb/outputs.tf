output "cluster_endpoint" {
  description = "DocumentDB cluster endpoint"
  value       = aws_docdb_cluster.main.endpoint
  sensitive   = true
}

output "cluster_reader_endpoint" {
  description = "DocumentDB cluster reader endpoint"
  value       = aws_docdb_cluster.main.reader_endpoint
  sensitive   = true
}

output "cluster_identifier" {
  description = "DocumentDB cluster identifier"
  value       = aws_docdb_cluster.main.cluster_identifier
}

output "cluster_arn" {
  description = "DocumentDB cluster ARN"
  value       = aws_docdb_cluster.main.arn
}

output "cluster_port" {
  description = "DocumentDB cluster port"
  value       = aws_docdb_cluster.main.port
}

output "security_group_id" {
  description = "Security group ID for DocumentDB"
  value       = aws_security_group.documentdb.id
}
