#!/bin/bash

# Generate Terraform Variables from Environment
# This script creates terraform.tfvars from environment variables

set -e

# Load environment variables if .env file exists
if [ -f ".env" ]; then
    source .env
else
    echo "⚠️  No .env file found. Please run ./configure-env.sh first"
    exit 1
fi

ENVIRONMENT=${1:-dev}
TFVARS_FILE="environments/${ENVIRONMENT}/terraform.tfvars"

echo "🔧 Generating Terraform variables for $ENVIRONMENT environment..."

# Create the directory if it doesn't exist
mkdir -p "environments/${ENVIRONMENT}"

# Generate terraform.tfvars
cat > "$TFVARS_FILE" << EOF
# Generated Terraform Variables from Environment Configuration
# Environment: $ENVIRONMENT
# Generated on: $(date)

# AWS Configuration
aws_region = "${AWS_REGION}"

# Project Configuration
project_name = "todo-app"
environment = "${ENVIRONMENT}"

# VPC Configuration
availability_zones = ["${AWS_REGION}a", "${AWS_REGION}b"]

# Docker Images
EOF

# Add environment-specific Docker images
case $ENVIRONMENT in
    dev)
        cat >> "$TFVARS_FILE" << EOF
frontend_image = "${FRONTEND_IMAGE_DEV:-${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/todo-app-frontend:dev}"
backend_image = "${BACKEND_IMAGE_DEV:-${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/todo-app-backend:dev}"

# Resource Sizing
frontend_cpu = ${DEV_FRONTEND_CPU:-256}
frontend_memory = ${DEV_FRONTEND_MEMORY:-512}
backend_cpu = ${DEV_BACKEND_CPU:-256}
backend_memory = ${DEV_BACKEND_MEMORY:-512}
db_instance_class = "${DEV_DB_INSTANCE_CLASS:-db.t3.micro}"
EOF
        ;;
    uat)
        cat >> "$TFVARS_FILE" << EOF
vpc_cidr = "10.1.0.0/16"
frontend_image = "${FRONTEND_IMAGE_UAT:-${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/todo-app-frontend:uat}"
backend_image = "${BACKEND_IMAGE_UAT:-${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/todo-app-backend:uat}"

# Resource Sizing
frontend_cpu = ${UAT_FRONTEND_CPU:-256}
frontend_memory = ${UAT_FRONTEND_MEMORY:-512}
backend_cpu = ${UAT_BACKEND_CPU:-512}
backend_memory = ${UAT_BACKEND_MEMORY:-1024}
db_instance_class = "${UAT_DB_INSTANCE_CLASS:-db.t3.small}"
EOF
        ;;
    prod)
        cat >> "$TFVARS_FILE" << EOF
vpc_cidr = "10.2.0.0/16"
frontend_image = "${FRONTEND_IMAGE_PROD:-${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/todo-app-frontend:prod}"
backend_image = "${BACKEND_IMAGE_PROD:-${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/todo-app-backend:prod}"

# Resource Sizing
frontend_cpu = ${PROD_FRONTEND_CPU:-512}
frontend_memory = ${PROD_FRONTEND_MEMORY:-1024}
backend_cpu = ${PROD_BACKEND_CPU:-1024}
backend_memory = ${PROD_BACKEND_MEMORY:-2048}
db_instance_class = "${PROD_DB_INSTANCE_CLASS:-db.t3.medium}"

# Production specific
db_allocated_storage = 100
EOF
        # Add domain configuration for production if available
        if [ -n "$DOMAIN_NAME" ] && [ "$DOMAIN_NAME" != "yourdomain.com" ]; then
            cat >> "$TFVARS_FILE" << EOF

# Domain Configuration
domain_name = "${DOMAIN_NAME}"
EOF
        fi
        
        if [ -n "$CERTIFICATE_ARN" ] && [[ "$CERTIFICATE_ARN" != *"your-cert-id"* ]]; then
            cat >> "$TFVARS_FILE" << EOF
certificate_arn = "${CERTIFICATE_ARN}"
EOF
        fi
        ;;
esac

echo "✅ Generated: $TFVARS_FILE"
echo "📋 Contents:"
echo "─────────────────────────────────────"
cat "$TFVARS_FILE"
echo "─────────────────────────────────────"