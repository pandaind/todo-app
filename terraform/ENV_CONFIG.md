## Environment Configuration (Non-Hardcoded Setup)

This project now supports environment variable-based configuration to avoid hardcoding values.

### Quick Start

1. **Configure Environment:**
   ```bash
   ./configure-env.sh
   ```
   This will:
   - Create `.env` file from template
   - Auto-detect your AWS Account ID
   - Prompt for region, S3 bucket, domain, etc.

2. **Deploy:**
   ```bash
   ./deploy.sh dev apply
   ```

### Manual Configuration

1. **Copy Template:**
   ```bash
   cp .env.template .env
   ```

2. **Edit Configuration:**
   ```bash
   vim .env
   ```
   Update the values:
   ```bash
   AWS_REGION="ap-south-1"
   AWS_ACCOUNT_ID="123456789012"
   TERRAFORM_STATE_BUCKET="my-terraform-state-bucket"
   DOMAIN_NAME="example.com"
   # ... etc
   ```

3. **Deploy:**
   ```bash
   source .env
   ./deploy.sh dev apply
   ```

### Environment Variables

The system uses these key variables:

#### AWS Configuration
- `AWS_REGION` - AWS region (default: ap-south-1)
- `AWS_ACCOUNT_ID` - Your AWS account ID
- `TERRAFORM_STATE_BUCKET` - S3 bucket for Terraform state
- `TERRAFORM_STATE_REGION` - Region for S3 bucket

#### Docker Images
- `FRONTEND_IMAGE_DEV/UAT/PROD` - ECR repository URLs
- `BACKEND_IMAGE_DEV/UAT/PROD` - ECR repository URLs

#### Resource Sizing
- `DEV_FRONTEND_CPU/MEMORY` - Dev environment sizing
- `UAT_FRONTEND_CPU/MEMORY` - UAT environment sizing  
- `PROD_FRONTEND_CPU/MEMORY` - Production environment sizing
- `DEV/UAT/PROD_DB_INSTANCE_CLASS` - Database instance types

#### Optional
- `DOMAIN_NAME` - Your domain for production
- `CERTIFICATE_ARN` - SSL certificate ARN
- `GITHUB_ACTIONS_ROLE_ARN` - IAM role for CI/CD

### How It Works

1. **Environment Loading:** All scripts automatically load `.env` if it exists
2. **Dynamic Variables:** `generate-tfvars.sh` creates `terraform.tfvars` from environment variables
3. **No Hardcoding:** All configurations come from environment variables or defaults
4. **Git Safe:** `.env` and `*.tfvars` files are ignored by git

### Benefits

✅ **No hardcoded values** - Everything configurable  
✅ **Environment specific** - Different configs per environment  
✅ **Git friendly** - Sensitive data not committed  
✅ **Team friendly** - Each developer has their own `.env`  
✅ **CI/CD ready** - Environment variables work in pipelines  
✅ **AWS Account agnostic** - Works across different AWS accounts  

### Scripts

- `./configure-env.sh` - Interactive environment setup
- `./generate-tfvars.sh <env>` - Generate Terraform variables
- `./deploy.sh <env> <action>` - Deploy with environment variables
- `./build-and-push.sh <env>` - Build/push with environment variables