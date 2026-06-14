resource "aws_db_instance" "primary" {
  identifier = "${var.project_name}-${var.environment}-db"

  engine         = "postgres"
  engine_version = "16.3"
  instance_class = var.instance_class

  allocated_storage     = var.allocated_storage
  storage_encrypted     = true
  storage_type          = "gp3"
  iops                  = 3000
  max_allocated_storage = var.allocated_storage * 2

  db_name  = var.db_name
  username = var.db_username
  password = var.db_password
  port     = 5432

  db_subnet_group_name   = var.db_subnet_group_name
  vpc_security_group_ids = [var.security_group_id]

  multi_az               = var.multi_az
  backup_retention_period = var.backup_retention_days
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:05:00-sun:06:00"

  copy_tags_to_snapshot = true
  skip_final_snapshot   = var.environment == "production" ? false : true
  final_snapshot_identifier = var.environment == "production" ? "${var.project_name}-${var.environment}-db-final-${formatdate("YYYY-MM-DD-hhmm", timestamp())}" : null

  enabled_cloudwatch_logs_exports = ["postgresql", "upgrade"]

  performance_insights_enabled          = var.environment == "production"
  performance_insights_retention_period = var.environment == "production" ? 7 : 0

  auto_minor_version_upgrade = true

  tags = { Name = "${var.project_name}-${var.environment}-db" }
}

resource "aws_db_instance" "replica" {
  count = var.environment == "production" ? 1 : 0

  identifier = "${var.project_name}-${var.environment}-db-replica"

  engine         = "postgres"
  engine_version = "16.3"
  instance_class = var.instance_class

  replicate_source_db = aws_db_instance.primary.identifier

  vpc_security_group_ids = [var.security_group_id]

  backup_retention_period = var.backup_retention_days
  backup_window           = "04:00-05:00"
  maintenance_window      = "sun:06:00-sun:07:00"

  copy_tags_to_snapshot = true
  skip_final_snapshot   = true

  performance_insights_enabled          = true
  performance_insights_retention_period = 7

  tags = { Name = "${var.project_name}-${var.environment}-db-replica" }
}
