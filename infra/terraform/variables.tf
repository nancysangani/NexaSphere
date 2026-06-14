variable "aws_region" {
  description = "AWS region for all resources"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Deployment environment (dev, staging, production)"
  type        = string
}

variable "project_name" {
  description = "Project name used for resource naming"
  type        = string
  default     = "nexasphere"
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "List of availability zones"
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b", "us-east-1c"]
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets"
  type        = list(string)
  default     = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"]
}

variable "database_subnet_cidrs" {
  description = "CIDR blocks for database subnets"
  type        = list(string)
  default     = ["10.0.201.0/24", "10.0.202.0/24", "10.0.203.0/24"]
}

variable "rds_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.medium"
}

variable "rds_allocated_storage" {
  description = "RDS allocated storage in GB"
  type        = number
  default     = 20
}

variable "rds_multi_az" {
  description = "Enable Multi-AZ for RDS"
  type        = bool
  default     = false
}

variable "rds_backup_retention_days" {
  description = "Number of days to retain RDS backups"
  type        = number
  default     = 7
}

variable "eks_node_instance_types" {
  description = "EC2 instance types for EKS node groups"
  type        = list(string)
  default     = ["t3.medium"]
}

variable "eks_desired_nodes" {
  description = "Desired number of EKS nodes"
  type        = number
  default     = 2
}

variable "eks_min_nodes" {
  description = "Minimum number of EKS nodes"
  type        = number
  default     = 1
}

variable "eks_max_nodes" {
  description = "Maximum number of EKS nodes"
  type        = number
  default     = 5
}

variable "domain_name" {
  description = "Domain name for CloudFront distributions"
  type        = string
  default     = ""
}

variable "acm_certificate_arn" {
  description = "ARN of ACM certificate for CloudFront"
  type        = string
  default     = ""
}
