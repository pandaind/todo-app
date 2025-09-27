#!/bin/bash

# Quick Setup Guide for Environment-Based Configuration
# Run this to get started with non-hardcoded setup

echo "🚀 Todo App - Environment Configuration Setup"
echo "=============================================="
echo ""
echo "This guide will help you set up environment-based configuration"
echo "to eliminate hardcoded values from your infrastructure."
echo ""

# Check if .env exists
if [ -f ".env" ]; then
    echo "✅ .env file already exists"
    echo "   You can edit it manually or run ./configure-env.sh to recreate"
else
    echo "📋 Step 1: Create environment configuration"
    echo "   Run: ./configure-env.sh"
    echo ""
fi

echo "📋 Step 2: Verify configuration"
echo "   Check: cat .env"
echo ""

echo "📋 Step 3: Generate Terraform variables"
echo "   Run: ./generate-tfvars.sh dev"
echo ""

echo "📋 Step 4: Deploy with environment variables"
echo "   Run: ./deploy.sh dev plan    # Test configuration"
echo "   Run: ./deploy.sh dev apply   # Deploy infrastructure"
echo ""

echo "📋 Step 5: Build and push Docker images (if needed)"
echo "   Run: ./build-and-push.sh dev"
echo ""

echo "🎯 Key Benefits:"
echo "   ✅ No hardcoded values in code"
echo "   ✅ Environment-specific configurations" 
echo "   ✅ Git-safe (sensitive data not committed)"
echo "   ✅ Team-friendly (each developer has own .env)"
echo "   ✅ CI/CD ready"
echo "   ✅ Multi-account support"
echo ""

echo "📁 Files created by this setup:"
echo "   .env                        # Your configuration (gitignored)"
echo "   environments/*/terraform.tfvars  # Generated variables (gitignored)"
echo "   .gitignore                  # Updated to exclude sensitive files"
echo ""

echo "🔧 Available scripts:"
echo "   ./configure-env.sh         # Interactive environment setup"
echo "   ./generate-tfvars.sh <env> # Generate Terraform variables"
echo "   ./deploy.sh <env> <action> # Deploy with environment variables"
echo "   ./build-and-push.sh <env>  # Build/push with environment variables"
echo ""

echo "📖 Documentation:"
echo "   ENV_CONFIG.md              # Detailed environment configuration guide"
echo "   README.md                  # General project documentation"