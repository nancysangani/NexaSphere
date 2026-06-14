output "vpc_id" {
  description = "ID of the created VPC"
  value       = module.vpc.vpc_id
}

output "vpc_cidr_block" {
  description = "CIDR block of the VPC"
  value       = module.vpc.vpc_cidr_block
}

output "private_subnet_ids" {
  description = "IDs of the private subnets"
  value       = module.vpc.private_subnet_ids
}

output "public_subnet_ids" {
  description = "IDs of the public subnets"
  value       = module.vpc.public_subnet_ids
}

output "database_subnet_ids" {
  description = "IDs of the database subnets"
  value       = module.vpc.database_subnet_ids
}

output "rds_endpoint" {
  description = "Endpoint of the RDS instance"
  value       = module.rds.endpoint
  sensitive   = true
}

output "rds_reader_endpoint" {
  description = "Reader endpoint of the RDS replica"
  value       = module.rds.reader_endpoint
  sensitive   = true
}

output "media_bucket_arn" {
  description = "ARN of the media S3 bucket"
  value       = module.s3.media_bucket_arn
}

output "backup_bucket_arn" {
  description = "ARN of the backup S3 bucket"
  value       = module.s3.backup_bucket_arn
}

output "cloudfront_domain" {
  description = "CloudFront distribution domain name"
  value       = module.cloudfront.domain_name
}

output "eks_cluster_name" {
  description = "Name of the EKS cluster"
  value       = module.eks.cluster_name
}

output "eks_cluster_endpoint" {
  description = "Endpoint of the EKS cluster"
  value       = module.eks.cluster_endpoint
  sensitive   = true
}
