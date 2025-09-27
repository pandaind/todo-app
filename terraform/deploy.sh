#!/bin/bash

# Terraform Deployment Script for Todo App
# Usage: ./deploy.sh [environment] [action]
# Example: ./deploy.sh dev plan
#          ./deploy.sh prod apply

set -e

# Load environment variables if .env file exists
if [ -f ".env" ]; then
    echo "📝 Loading environment configuration from .env..."
    source .env
    echo "✅ Environment variables loaded"
else
    echo "⚠️  No .env file found. Run ./configure-env.sh to create one, or manually create .env from .env.template"
fi

ENVIRONMENT=${1:-dev}
ACTION=${2:-plan}

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(dev|uat|prod)$ ]]; then
    echo "Error: Environment must be dev, uat, or prod"
    exit 1
fi

# Validate action
if [[ ! "$ACTION" =~ ^(plan|apply|destroy|init)$ ]]; then
    echo "Error: Action must be plan, apply, destroy, or init"
    exit 1
fi

echo "=========================================="
echo "Deploying Todo App to $ENVIRONMENT"
echo "Action: $ACTION"
echo "=========================================="

# Generate terraform.tfvars from environment variables
echo "🔧 Generating Terraform variables..."
./generate-tfvars.sh "$ENVIRONMENT"

# Change to environment directory
cd "environments/$ENVIRONMENT"

# Initialize Terraform if needed
if [ "$ACTION" = "init" ] || [ ! -d ".terraform" ]; then
    echo "Initializing Terraform..."
    if ! terraform init; then
        echo "Initial terraform init failed, attempting with -reconfigure..."
        terraform init -reconfigure
    fi
fi

# Run the specified action
case $ACTION in
    "plan")
        echo "Planning deployment..."
        terraform plan -var-file="terraform.tfvars"
        ;;
    "apply")
        echo "Applying deployment..."
        terraform apply -auto-approve -var-file="terraform.tfvars"
        echo "Deployment completed!"
        echo "Application URL: $(terraform output -raw application_url)"
        ;;
    "destroy")
        echo "WARNING: This will destroy all resources!"
        read -p "Are you sure? (yes/no): " confirm
        if [ "$confirm" = "yes" ]; then
            terraform destroy -auto-approve -var-file="terraform.tfvars"
            echo "Resources destroyed!"
        else
            echo "Destroy cancelled."
        fi
        ;;
    "init")
        echo "Terraform initialized!"
        ;;
esac

echo "Operation completed successfully!"
