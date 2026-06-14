output "media_bucket_id" {
  value = aws_s3_bucket.media.id
}

output "media_bucket_arn" {
  value = aws_s3_bucket.media.arn
}

output "backup_bucket_id" {
  value = aws_s3_bucket.backups.id
}

output "backup_bucket_arn" {
  value = aws_s3_bucket.backups.arn
}

output "terraform_state_bucket_id" {
  value = aws_s3_bucket.terraform_state.id
}
