#!/bin/bash

# Quick Setup Script for Todo App AWS ECS Deployment
# This script helps you set up the initial infrastructure

set -e

echo "=========================================="
echo "Todo App AWS ECS Setup"
echo "=========================================="

# Check prerequisites
echo "Checking prerequisites..."

if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI not found. Please install AWS CLI first."
    exit 1
fi

if ! command -v terraform &> /dev/null; then
    echo "❌ Terraform not found. Please install Terraform first."
    exit 1
fi

if ! command -v docker &> /dev/null; then
    echo "❌ Docker not found. Please install Docker first."
    exit 1
fi

# Get AWS Account ID
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text 2>/dev/null)
if [ -z "$AWS_ACCOUNT_ID" ]; then
    echo "❌ Unable to get AWS Account ID. Please configure AWS credentials."
    exit 1
fi

AWS_REGION=${AWS_REGION:-ap-south-1}

echo "✅ Prerequisites check passed"
echo "AWS Account ID: $AWS_ACCOUNT_ID"
echo "AWS Region: $AWS_REGION"

# Prompt for S3 bucket name
read -p "Enter S3 bucket name for Terraform state (or press Enter for default): " S3_BUCKET
S3_BUCKET=${S3_BUCKET:-"todo-app-terraform-state-${AWS_ACCOUNT_ID}"}

# Create S3 bucket for Terraform state
echo "Creating S3 bucket for Terraform state..."
if aws s3 ls "s3://${S3_BUCKET}" 2>&1 | grep -q 'NoSuchBucket'; then
    aws s3 mb "s3://${S3_BUCKET}" --region $AWS_REGION
    aws s3api put-bucket-versioning --bucket $S3_BUCKET --versioning-configuration Status=Enabled
    aws s3api put-bucket-encryption --bucket $S3_BUCKET --server-side-encryption-configuration '{
        "Rules": [
            {
                "ApplyServerSideEncryptionByDefault": {
                    "SSEAlgorithm": "AES256"
                }
            }
        ]
    }'
    echo "✅ S3 bucket created: $S3_BUCKET"
else
    echo "✅ S3 bucket already exists: $S3_BUCKET"
fi

# Create DynamoDB table for state locking
DYNAMODB_TABLE="terraform-state-locks"
echo "Creating DynamoDB table for state locking..."
if ! aws dynamodb describe-table --table-name $DYNAMODB_TABLE --region $AWS_REGION >/dev/null 2>&1; then
    aws dynamodb create-table \
        --table-name $DYNAMODB_TABLE \
        --attribute-definitions AttributeName=LockID,AttributeType=S \
        --key-schema AttributeName=LockID,KeyType=HASH \
        --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 \
        --region $AWS_REGION >/dev/null
    echo "✅ DynamoDB table created: $DYNAMODB_TABLE"
else
    echo "✅ DynamoDB table already exists: $DYNAMODB_TABLE"
fi

# Update terraform backend configuration
echo "Updating Terraform backend configuration..."
for env in dev uat prod; do
    sed -i.bak "s/your-terraform-state-bucket/${S3_BUCKET}/g" "environments/${env}/main.tf"
    sed -i.bak "s/us-west-2/${AWS_REGION}/g" "environments/${env}/main.tf"
    rm "environments/${env}/main.tf.bak"
done

# Create ECR repositories
echo "Creating ECR repositories..."
for repo in todo-app-frontend todo-app-backend; do
    if ! aws ecr describe-repositories --repository-names $repo --region $AWS_REGION >/dev/null 2>&1; then
        aws ecr create-repository --repository-name $repo --region $AWS_REGION >/dev/null
        echo "✅ ECR repository created: $repo"
    else
        echo "✅ ECR repository already exists: $repo"
    fi
done

# Update environment configurations with ECR URLs
echo "Updating environment configurations..."
FRONTEND_ECR="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/todo-app-frontend"
BACKEND_ECR="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/todo-app-backend"

for env in dev uat prod; do
    sed -i.bak "s|your-account.dkr.ecr.us-west-2.amazonaws.com/todo-app-frontend:${env}|${FRONTEND_ECR}:${env}|g" "environments/${env}/main.tf"
    sed -i.bak "s|your-account.dkr.ecr.us-west-2.amazonaws.com/todo-app-backend:${env}|${BACKEND_ECR}:${env}|g" "environments/${env}/main.tf"
    rm "environments/${env}/main.tf.bak"
done

echo "=========================================="
echo "Setup completed successfully! 🎉"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Build and push Docker images:"
echo "   ./build-and-push.sh dev"
echo ""
echo "2. Deploy infrastructure:"
echo "   ./deploy.sh dev init"
echo "   ./deploy.sh dev apply"
echo ""
echo "3. For production, update domain and certificate settings in:"
echo "   environments/prod/main.tf"
echo ""
echo "Configuration details:"
echo "- S3 State Bucket: $S3_BUCKET"
echo "- DynamoDB Table: $DYNAMODB_TABLE"
echo "- Frontend ECR: $FRONTEND_ECR"
echo "- Backend ECR: $BACKEND_ECR"
echo ""
echo "See README.md for detailed instructions."
