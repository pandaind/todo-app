#!/bin/bash

# Configure Environment Script
# This script helps set up the environment configuration from template

set -e

CONFIG_FILE=".env"
TEMPLATE_FILE=".env.template"

echo "🚀 Todo App Environment Configuration"
echo "======================================"

# Check if .env already exists
if [ -f "$CONFIG_FILE" ]; then
    echo "⚠️  Configuration file (.env) already exists."
    read -p "Do you want to overwrite it? (y/N): " overwrite
    if [[ ! $overwrite =~ ^[Yy]$ ]]; then
        echo "Configuration cancelled."
        exit 0
    fi
fi

# Copy template to .env
cp "$TEMPLATE_FILE" "$CONFIG_FILE"
echo "✅ Copied template to .env"

# Get AWS Account ID automatically
echo "🔍 Detecting AWS configuration..."
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text 2>/dev/null || echo "")

if [ -n "$AWS_ACCOUNT_ID" ]; then
    echo "✅ Detected AWS Account ID: $AWS_ACCOUNT_ID"
    sed -i "s/123456789012/$AWS_ACCOUNT_ID/g" "$CONFIG_FILE"
else
    echo "⚠️  Could not detect AWS Account ID. Please ensure AWS CLI is configured."
    read -p "Enter your AWS Account ID: " AWS_ACCOUNT_ID
    if [ -n "$AWS_ACCOUNT_ID" ]; then
        sed -i "s/123456789012/$AWS_ACCOUNT_ID/g" "$CONFIG_FILE"
    fi
fi

# Prompt for region (default to ap-south-1)
echo ""
read -p "Enter AWS Region [ap-south-1]: " aws_region
aws_region=${aws_region:-ap-south-1}
sed -i "s/ap-south-1/$aws_region/g" "$CONFIG_FILE"
echo "✅ Set AWS Region: $aws_region"

# Prompt for S3 bucket for backend (optional)
echo ""
read -p "Enter S3 bucket name for Terraform state (optional): " s3_bucket
if [ -n "$s3_bucket" ]; then
    sed -i "s/your-terraform-state-bucket/$s3_bucket/g" "$CONFIG_FILE"
    echo "✅ Set S3 bucket: $s3_bucket"
fi

# Prompt for domain name (optional)
echo ""
read -p "Enter your domain name (optional, press Enter to skip): " domain_name
if [ -n "$domain_name" ]; then
    sed -i "s/yourdomain.com/$domain_name/g" "$CONFIG_FILE"
    echo "✅ Set domain: $domain_name"
fi

echo ""
echo "🎉 Environment configuration complete!"
echo ""
echo "📝 Next steps:"
echo "   1. Review and edit .env file if needed"
echo "   2. Run: source .env"
echo "   3. Deploy with: ./deploy.sh dev apply"
echo ""
echo "📄 Configuration saved to: $CONFIG_FILE"