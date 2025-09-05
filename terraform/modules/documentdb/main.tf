# DocumentDB Subnet Group
resource "aws_docdb_subnet_group" "main" {
  name       = "${var.name_prefix}-docdb-subnet-group"
  subnet_ids = var.private_subnets

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-docdb-subnet-group"
  })
}

# Security Group for DocumentDB
resource "aws_security_group" "documentdb" {
  name        = "${var.name_prefix}-docdb-sg"
  description = "Security group for DocumentDB cluster"
  vpc_id      = var.vpc_id

  ingress {
    description = "MongoDB from ECS"
    from_port   = 27017
    to_port     = 27017
    protocol    = "tcp"
    cidr_blocks = [data.aws_vpc.main.cidr_block]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-docdb-sg"
  })
}

# DocumentDB Cluster Parameter Group
resource "aws_docdb_cluster_parameter_group" "main" {
  family = "docdb5.0"
  name   = "${var.name_prefix}-docdb-params"

  parameter {
    name  = "tls"
    value = "enabled"
  }

  parameter {
    name  = "ttl_monitor"
    value = "enabled"
  }

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-docdb-params"
  })
}

# DocumentDB Cluster
resource "aws_docdb_cluster" "main" {
  cluster_identifier      = "${var.name_prefix}-docdb-cluster"
  engine                  = "docdb"
  engine_version          = "5.0.0"
  master_username         = var.master_username
  master_password         = var.master_password
  backup_retention_period = 7
  preferred_backup_window = "03:00-04:00"
  
  # Storage configuration
  storage_encrypted = true
  storage_type     = "standard"
  
  # Network configuration
  db_subnet_group_name   = aws_docdb_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.documentdb.id]
  
  # Parameter group
  db_cluster_parameter_group_name = aws_docdb_cluster_parameter_group.main.name
  
  # Backup and maintenance
  preferred_maintenance_window = "sun:04:00-sun:05:00"
  skip_final_snapshot         = true
  deletion_protection         = false
  
  # Enable logging
  enabled_cloudwatch_logs_exports = ["audit", "profiler"]

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-docdb-cluster"
  })
}

# DocumentDB Cluster Instances
resource "aws_docdb_cluster_instance" "cluster_instances" {
  count              = var.instance_count
  identifier         = "${var.name_prefix}-docdb-instance-${count.index + 1}"
  cluster_identifier = aws_docdb_cluster.main.id
  instance_class     = var.instance_class

  performance_insights_enabled = true
  
  tags = merge(var.tags, {
    Name = "${var.name_prefix}-docdb-instance-${count.index + 1}"
  })
}

# CloudWatch Log Groups
resource "aws_cloudwatch_log_group" "documentdb_audit" {
  name              = "/aws/docdb/${aws_docdb_cluster.main.cluster_identifier}/audit"
  retention_in_days = 30

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-docdb-audit-logs"
  })
}

resource "aws_cloudwatch_log_group" "documentdb_profiler" {
  name              = "/aws/docdb/${aws_docdb_cluster.main.cluster_identifier}/profiler"
  retention_in_days = 7

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-docdb-profiler-logs"
  })
}

# Data source for VPC information
data "aws_vpc" "main" {
  id = var.vpc_id
}
