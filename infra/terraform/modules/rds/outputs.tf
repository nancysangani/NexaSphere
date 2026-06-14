output "endpoint" {
  value = aws_db_instance.primary.endpoint
}

output "reader_endpoint" {
  value = try(aws_db_instance.replica[0].endpoint, aws_db_instance.primary.endpoint)
}

output "arn" {
  value = aws_db_instance.primary.arn
}

output "id" {
  value = aws_db_instance.primary.id
}
