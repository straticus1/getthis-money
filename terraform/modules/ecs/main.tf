# ECS Cluster
resource "aws_ecs_cluster" "main" {
  name = "${var.name_prefix}-cluster"

  configuration {
    execute_command_configuration {
      logging = "OVERRIDE"
      log_configuration {
        cloud_watch_log_group_name = aws_cloudwatch_log_group.ecs_exec.name
      }
    }
  }

  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-ecs-cluster"
  })
}

# CloudWatch Log Group for ECS Exec
resource "aws_cloudwatch_log_group" "ecs_exec" {
  name              = "/aws/ecs/${var.name_prefix}-exec"
  retention_in_days = 7

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-ecs-exec-logs"
  })
}

# CloudWatch Log Group for Application
resource "aws_cloudwatch_log_group" "app" {
  name              = "/aws/ecs/${var.name_prefix}-app"
  retention_in_days = 30

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-app-logs"
  })
}

# Security Group for ECS Service
resource "aws_security_group" "ecs_service" {
  name        = "${var.name_prefix}-ecs-service-sg"
  description = "Security group for ECS service"
  vpc_id      = var.vpc_id

  ingress {
    description     = "HTTP from ALB"
    from_port       = 5000
    to_port         = 5000
    protocol        = "tcp"
    security_groups = [var.alb_security_group_id]
  }

  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-ecs-service-sg"
  })
}

# ECS Task Definition
resource "aws_ecs_task_definition" "app" {
  family                   = "${var.name_prefix}-app"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.task_cpu
  memory                   = var.task_memory
  execution_role_arn       = var.execution_role_arn
  task_role_arn           = var.task_role_arn

  container_definitions = jsonencode([
    {
      name  = "app"
      image = "${var.ecr_repository_url}:latest"
      
      essential = true
      
      portMappings = [
        {
          name          = "app"
          containerPort = 5000
          hostPort      = 5000
          protocol      = "tcp"
        }
      ]
      
      environment = var.environment_vars
      secrets     = var.secrets
      
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.app.name
          "awslogs-region"        = data.aws_region.current.name
          "awslogs-stream-prefix" = "ecs"
        }
      }
      
      healthCheck = {
        command     = ["CMD-SHELL", "curl -f http://localhost:5000/api/health || exit 1"]
        interval    = 30
        timeout     = 5
        retries     = 3
        startPeriod = 60
      }

      # Resource limits
      memoryReservation = var.task_memory_reservation
      
      # Security
      readonlyRootFilesystem = false
      user                  = "1001:1001"
    }
  ])

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-task-definition"
  })
}

# ECS Service
resource "aws_ecs_service" "app" {
  name            = "${var.name_prefix}-service"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.app.arn
  desired_count   = var.desired_count
  launch_type     = "FARGATE"
  
  platform_version = "LATEST"

  network_configuration {
    security_groups  = [aws_security_group.ecs_service.id]
    subnets         = var.private_subnets
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = var.alb_target_group_arn
    container_name   = "app"
    container_port   = 5000
  }

  # Auto-scaling configuration
  deployment_configuration {
    deployment_circuit_breaker {
      enable   = true
      rollback = true
    }
    
    maximum_percent         = 200
    minimum_healthy_percent = 100
  }

  # Service discovery (optional)
  enable_execute_command = true

  depends_on = [var.alb_target_group_arn]

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-ecs-service"
  })
}

# Auto Scaling Target
resource "aws_appautoscaling_target" "ecs_target" {
  max_capacity       = var.max_capacity
  min_capacity       = var.min_capacity
  resource_id        = "service/${aws_ecs_cluster.main.name}/${aws_ecs_service.app.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"

  tags = var.tags
}

# Auto Scaling Policy - CPU
resource "aws_appautoscaling_policy" "scale_up_cpu" {
  name               = "${var.name_prefix}-scale-up-cpu"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.ecs_target.resource_id
  scalable_dimension = aws_appautoscaling_target.ecs_target.scalable_dimension
  service_namespace  = aws_appautoscaling_target.ecs_target.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
    target_value = 70.0
  }
}

# Auto Scaling Policy - Memory
resource "aws_appautoscaling_policy" "scale_up_memory" {
  name               = "${var.name_prefix}-scale-up-memory"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.ecs_target.resource_id
  scalable_dimension = aws_appautoscaling_target.ecs_target.scalable_dimension
  service_namespace  = aws_appautoscaling_target.ecs_target.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageMemoryUtilization"
    }
    target_value = 80.0
  }
}

# Data source for current region
data "aws_region" "current" {}
