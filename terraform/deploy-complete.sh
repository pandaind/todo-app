#!/bin/bash

# Complete Deployment Script for Todo App
# Handles ECR creation, image building, and infrastructure deployment
# Usage: ./deploy-complete.sh [environment] [action]

set -e

ENVIRONMENT=${1:-dev}
ACTION=${2:-plan}

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(dev|uat|prod)$ ]]; then
    echo "Error: Environment must be dev, uat, or prod"
    exit 1
fi

# Load environment variables if .env file exists
if [ -f ".env" ]; then
    echo "📝 Loading environment configuration from .env..."
    source .env
    echo "✅ Environment variables loaded"
fi

AWS_ACCOUNT_ID=${AWS_ACCOUNT_ID:-$(aws sts get-caller-identity --query Account --output text)}
AWS_REGION=${AWS_REGION:-"ap-south-1"}

echo "=========================================="
echo "Complete Todo App Deployment"
echo "Environment: $ENVIRONMENT"
echo "Action: $ACTION" 
echo "AWS Account: $AWS_ACCOUNT_ID"
echo "AWS Region: $AWS_REGION"
echo "=========================================="

case $ACTION in
    "plan")
        echo "🔍 Planning complete deployment..."
        
        # Generate terraform.tfvars
        echo "🔧 Generating Terraform variables..."
        ./generate-tfvars.sh "$ENVIRONMENT"
        
        # Plan the deployment
        cd "environments/$ENVIRONMENT"
        terraform init
        terraform plan -var-file="terraform.tfvars"
        
        echo "📋 Deployment plan completed!"
        echo "💡 To actually deploy, run: ./deploy-complete.sh $ENVIRONMENT apply"
        ;;
        
    "apply")
        echo "🚀 Starting complete deployment..."
        
        # Step 1: Deploy ECR repositories first
        echo "📦 Step 1: Creating ECR repositories..."
        ./generate-tfvars.sh "$ENVIRONMENT"
        cd "environments/$ENVIRONMENT"
        terraform init
        
        # Create ECR repositories only
        terraform apply -auto-approve -target=aws_ecr_repository.frontend -target=aws_ecr_repository.backend
        echo "✅ ECR repositories created"
        
        # Step 2: Build and push Docker images
        echo "🔨 Step 2: Building and pushing Docker images..."
        cd ../..
        ./build-and-push.sh "$ENVIRONMENT"
        echo "✅ Docker images pushed to ECR"
        
        # Step 3: Deploy remaining infrastructure
        echo "🏗️  Step 3: Deploying remaining infrastructure..."
        cd "environments/$ENVIRONMENT"
        terraform apply -auto-approve -var-file="terraform.tfvars"
        
        echo "🎉 Deployment completed successfully!"
        echo "🌐 Application URL: $(terraform output -raw application_url)"
        echo "🗄️  Database: $(terraform output -raw rds_endpoint)"
        ;;
        
    "destroy")
        echo "⚠️  WARNING: This will destroy all resources including data!"
        echo "📋 Resources that will be destroyed:"
        echo "   - All ECS services and tasks"
        echo "   - Load balancer and networking"
        echo "   - RDS database (data will be lost!)"
        echo "   - ECR repositories and Docker images"
        
        read -p "Are you absolutely sure? Type 'destroy' to confirm: " confirm
        if [ "$confirm" = "destroy" ]; then
            ./generate-tfvars.sh "$ENVIRONMENT"
            cd "environments/$ENVIRONMENT"
            terraform destroy -auto-approve -var-file="terraform.tfvars"
            echo "💥 All resources destroyed!"
        else
            echo "❌ Destroy cancelled."
        fi
        ;;
        
    "status")
        echo "📊 Checking deployment status..."
        cd "environments/$ENVIRONMENT"
        if [ -f "terraform.tfstate" ]; then
            echo "🟢 Infrastructure deployed"
            terraform output
        else
            echo "🔴 No deployment found"
        fi
        ;;
        
    *)
        echo "Error: Action must be plan, apply, destroy, or status"
        echo "Usage: $0 [environment] [action]"
        echo "Example: $0 dev plan"
        exit 1
        ;;
esac

echo "Operation completed!"