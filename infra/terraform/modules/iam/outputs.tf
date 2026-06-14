output "eks_cluster_role_arn" {
  value = aws_iam_role.eks_cluster.arn
}

output "eks_node_role_arn" {
  value = aws_iam_role.eks_node.arn
}

output "backup_role_arn" {
  value = aws_iam_role.backup.arn
}

output "kms_key_arn" {
  value = aws_kms_key.eks.arn
}
