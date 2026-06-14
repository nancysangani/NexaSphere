resource "aws_eks_cluster" "main" {
  name     = "${var.project_name}-${var.environment}-eks"
  version  = "1.30"
  role_arn = var.cluster_role_arn

  vpc_config {
    subnet_ids              = var.private_subnet_ids
    endpoint_private_access = true
    endpoint_public_access  = var.environment == "production" ? false : true
    public_access_cidrs     = var.environment == "production" ? [] : ["0.0.0.0/0"]
    security_group_ids      = [var.cluster_security_group_id]
  }

  kubernetes_network_config {
    service_ipv4_cidr = "172.20.0.0/16"
  }

  encryption_config {
    provider {
      key_arn = var.kms_key_arn
    }
    resources = ["secrets"]
  }

  tags = { Name = "${var.project_name}-${var.environment}-eks" }
}

resource "aws_eks_node_group" "main" {
  cluster_name    = aws_eks_cluster.main.name
  node_group_name = "${var.project_name}-${var.environment}-ng"
  node_role_arn   = var.node_role_arn
  subnet_ids      = var.private_subnet_ids

  instance_types = var.node_instance_types
  disk_size      = 50

  scaling_config {
    desired_size = var.desired_nodes
    min_size     = var.min_nodes
    max_size     = var.max_nodes
  }

  update_config {
    max_unavailable = 1
  }

  ami_type = "AL2_x86_64"
  capacity_type = var.environment == "production" ? "ON_DEMAND" : "SPOT"

  tags = { Name = "${var.project_name}-${var.environment}-eks-ng" }
}

resource "aws_eks_addon" "coredns" {
  cluster_name = aws_eks_cluster.main.name
  addon_name   = "coredns"
  addon_version = "v1.11.1-eksbuild.4"
}

resource "aws_eks_addon" "kube_proxy" {
  cluster_name = aws_eks_cluster.main.name
  addon_name   = "kube-proxy"
  addon_version = "v1.30.0-eksbuild.2"
}

resource "aws_eks_addon" "vpc_cni" {
  cluster_name = aws_eks_cluster.main.name
  addon_name   = "vpc-cni"
  addon_version = "v1.18.1-eksbuild.1"
}
