#!/bin/bash

# Docker Build and Push Script for Todo App
# This script builds and pushes Docker images to ECR
# Usage: ./build-and-push.sh [environment]

set -e

# Load environment variables if .env file exists
if [ -f ".env" ]; then
    echo "📝 Loading environment configuration from .env..."
    source .env
    echo "✅ Environment variables loaded"
else
    echo "⚠️  No .env file found. Using defaults or detecting values..."
fi

ENVIRONMENT=${1:-dev}
AWS_REGION=${AWS_REGION:-"ap-south-1"}
AWS_ACCOUNT_ID=${AWS_ACCOUNT_ID:-$(aws sts get-caller-identity --query Account --output text)}

if [ -z "$AWS_ACCOUNT_ID" ]; then
    echo "Error: Unable to get AWS Account ID. Please check your AWS credentials."
    exit 1
fi


ECR_FRONTEND_REPO="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/todo-app-frontend"
ECR_BACKEND_REPO="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/todo-app-backend"

echo "=========================================="
echo "Building and pushing Docker images"
echo "Environment: $ENVIRONMENT"
echo "AWS Account: $AWS_ACCOUNT_ID"
echo "AWS Region: $AWS_REGION"
echo "=========================================="

# Login to ECR
echo "Logging into ECR..."
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_FRONTEND_REPO

# Build and push frontend image
echo "Building frontend image..."
cd ../frontend
docker build -f Dockerfile.prod -t todo-app-frontend:$ENVIRONMENT .
docker tag todo-app-frontend:$ENVIRONMENT $ECR_FRONTEND_REPO:$ENVIRONMENT
docker tag todo-app-frontend:$ENVIRONMENT $ECR_FRONTEND_REPO:latest

echo "Pushing frontend image..."
docker push $ECR_FRONTEND_REPO:$ENVIRONMENT
docker push $ECR_FRONTEND_REPO:latest

# Build and push backend image
echo "Building backend image..."
cd ../backend
docker build -f Dockerfile.prod -t todo-app-backend:$ENVIRONMENT .
docker tag todo-app-backend:$ENVIRONMENT $ECR_BACKEND_REPO:$ENVIRONMENT
docker tag todo-app-backend:$ENVIRONMENT $ECR_BACKEND_REPO:latest

echo "Pushing backend image..."
docker push $ECR_BACKEND_REPO:$ENVIRONMENT
docker push $ECR_BACKEND_REPO:latest

echo "=========================================="
echo "Docker images built and pushed successfully!"
echo "Frontend: $ECR_FRONTEND_REPO:$ENVIRONMENT"
echo "Backend: $ECR_BACKEND_REPO:$ENVIRONMENT"
echo "=========================================="
