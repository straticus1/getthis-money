variable "name_prefix" {
  description = "Name prefix for resources"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "private_subnets" {
  description = "Private subnet IDs"
  type        = list(string)
}

variable "alb_target_group_arn" {
  description = "ALB target group ARN"
  type        = string
}

variable "alb_security_group_id" {
  description = "ALB security group ID"
  type        = string
}

variable "ecr_repository_url" {
  description = "ECR repository URL"
  type        = string
}

variable "task_role_arn" {
  description = "ECS task role ARN"
  type        = string
}

variable "execution_role_arn" {
  description = "ECS execution role ARN"
  type        = string
}

variable "environment_vars" {
  description = "Environment variables for the container"
  type = list(object({
    name  = string
    value = string
  }))
  default = []
}

variable "secrets" {
  description = "Secrets for the container"
  type = list(object({
    name      = string
    valueFrom = string
  }))
  default = []
}

variable "task_cpu" {
  description = "CPU units for the task"
  type        = string
  default     = "512"
}

variable "task_memory" {
  description = "Memory for the task"
  type        = string
  default     = "1024"
}

variable "task_memory_reservation" {
  description = "Memory reservation for the container"
  type        = number
  default     = 512
}

variable "desired_count" {
  description = "Desired number of tasks"
  type        = number
  default     = 2
}

variable "min_capacity" {
  description = "Minimum number of tasks"
  type        = number
  default     = 1
}

variable "max_capacity" {
  description = "Maximum number of tasks"
  type        = number
  default     = 10
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}
