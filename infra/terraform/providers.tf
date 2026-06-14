provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "NexaSphere"
      ManagedBy   = "Terraform"
      Environment = var.environment
      Repo        = "github.com/Ayushh-Sharmaa/NexaSphere"
    }
  }
}
