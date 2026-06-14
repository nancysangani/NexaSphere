#!/usr/bin/env bash
# Bootstrap script to create Terraform state backend resources.
# Run once before terraform init.
# Requires AWS CLI with appropriate credentials.

set -euo pipefail

STATE_BUCKET="nexasphere-terraform-state"
LOCK_TABLE="nexasphere-terraform-locks"
REGION="us-east-1"

echo "Creating S3 bucket for Terraform state..."
if aws s3 ls "s3://$STATE_BUCKET" 2>/dev/null; then
  echo "Bucket $STATE_BUCKET already exists."
else
  aws s3 mb "s3://$STATE_BUCKET" --region "$REGION"
  aws s3api put-bucket-versioning \
    --bucket "$STATE_BUCKET" \
    --versioning-configuration Status=Enabled
  aws s3api put-public-access-block \
    --bucket "$STATE_BUCKET" \
    --public-access-block-configuration BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true
  aws s3api put-bucket-encryption \
    --bucket "$STATE_BUCKET" \
    --server-side-encryption-configuration '{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"AES256"}}]}'
  echo "Bucket $STATE_BUCKET created and configured."
fi

echo "Creating DynamoDB table for state locking..."
if aws dynamodb describe-table --table-name "$LOCK_TABLE" --region "$REGION" 2>/dev/null; then
  echo "Table $LOCK_TABLE already exists."
else
  aws dynamodb create-table \
    --table-name "$LOCK_TABLE" \
    --attribute-definitions AttributeName=LockID,AttributeType=S \
    --key-schema AttributeName=LockID,KeyType=HASH \
    --billing-mode PAY_PER_REQUEST \
    --region "$REGION"
  echo "Table $LOCK_TABLE created."
fi

echo "Bootstrap complete. Run 'terraform init' in your environment directory."
