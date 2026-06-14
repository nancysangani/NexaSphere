terraform {
  backend "s3" {
    bucket         = "nexasphere-terraform-state"
    key            = "terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "nexasphere-terraform-locks"
  }
}
