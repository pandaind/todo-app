# Todo App - AWS ECS Deployment with Terraform

This repository contains Terraform configurations to deploy a containerized Todo application to AWS ECS across multiple environments (dev, uat, prod) with **environment-based configuration** (no hardcoded values).

## 🚀 Quick Start

### 1. Configure Environment (One-time setup)
```bash
./configure-env.sh
```
This interactive script will:
- Auto-detect your AWS Account ID
- Prompt for AWS region (default: ap-south-1)
- Set up S3 bucket for Terraform state (optional)
- Configure domain and SSL certificate (optional)
- Create `.env` file with your settings

### 2. Deploy Infrastructure
```bash
./deploy.sh dev apply    # Deploy development environment
./deploy.sh uat apply    # Deploy UAT environment  
./deploy.sh prod apply   # Deploy production environment
```

### 3. Build and Push Docker Images (if needed)
```bash
./build-and-push.sh dev  # Build and push to ECR
```

## Architecture

The deployment includes:

- **VPC** with public and private subnets across 2 AZs
- **Application Load Balancer** for routing traffic
- **ECS Fargate** cluster running frontend and backend services
- **RDS PostgreSQL** database in private subnets
- **ECR** repositories for Docker images
- **Auto Scaling** based on CPU utilization
- **CloudWatch** logging and monitoring
- **Secrets Manager** for database credentials
- **Route53** DNS records (optional)
- **SSL/TLS** termination at ALB (optional)

## Project Structure

```
terraform/
├── modules/
│   ├── networking/     # VPC, subnets, routing
│   ├── alb/           # Application Load Balancer
│   ├── ecs/           # ECS cluster and services
│   └── rds/           # PostgreSQL database
├── environments/
│   ├── dev/           # Development environment
│   ├── uat/           # UAT environment
│   └── prod/          # Production environment
├── .env.template      # Configuration template
├── configure-env.sh   # Environment setup script
├── generate-tfvars.sh # Dynamic Terraform variables
├── deploy.sh          # Deployment script
├── build-and-push.sh  # Docker build script
├── setup-guide.sh     # Quick start guide
└── main.tf            # Main module composition
```

## Environment Configuration

### ⚡ Quick Setup

**Method 1: Interactive Setup (Recommended)**
```bash
./configure-env.sh
```

**Method 2: Manual Setup**
```bash
cp .env.template .env
# Edit .env with your values
vim .env
```

### Environment Variables

The configuration is controlled by these key variables in `.env`:

#### AWS Configuration
- `AWS_REGION` - AWS region (default: ap-south-1)
- `AWS_ACCOUNT_ID` - Your AWS account ID (auto-detected)
- `TERRAFORM_STATE_BUCKET` - S3 bucket for Terraform state (optional)

#### Docker Images  
- `FRONTEND_IMAGE_DEV/UAT/PROD` - ECR repository URLs
- `BACKEND_IMAGE_DEV/UAT/PROD` - ECR repository URLs

#### Resource Sizing
- `DEV_FRONTEND_CPU/MEMORY` - Dev environment resources
- `UAT_FRONTEND_CPU/MEMORY` - UAT environment resources  
- `PROD_FRONTEND_CPU/MEMORY` - Production environment resources
- `DEV/UAT/PROD_DB_INSTANCE_CLASS` - Database instance types

#### Optional
- `DOMAIN_NAME` - Your domain for production
- `CERTIFICATE_ARN` - SSL certificate ARN

### How It Works

1. **Environment Loading**: Scripts automatically load `.env` if it exists
2. **Dynamic Variables**: `generate-tfvars.sh` creates `terraform.tfvars` from environment variables
3. **No Hardcoding**: All configurations come from environment variables or defaults
4. **Git Safe**: `.env` and `*.tfvars` files are ignored by git

## Deployment

### Commands

```bash
# Initialize Terraform
./deploy.sh <env> init

# Plan deployment  
./deploy.sh <env> plan

# Apply changes
./deploy.sh <env> apply

# Destroy infrastructure
./deploy.sh <env> destroy
```

Where `<env>` is: `dev`, `uat`, or `prod`

### Build and Push Images

```bash
./build-and-push.sh <env>
```

## Environment Configurations

### Development (dev)
- **Backend**: Local state storage
- **Resources**: Minimal (1 task per service, db.t3.micro)
- **VPC**: 10.0.0.0/16
- **Purpose**: Development and testing

### UAT
- **Backend**: S3 + DynamoDB (optional)
- **Resources**: Moderate (2 tasks per service, db.t3.small) 
- **VPC**: 10.1.0.0/16
- **Purpose**: User acceptance testing

### Production (prod)
- **Backend**: S3 + DynamoDB (recommended)
- **Resources**: High availability (3+ tasks, db.t3.medium+)
- **VPC**: 10.2.0.0/16
## S3 Backend Setup (Optional for UAT/Prod)

If you want to use S3 backend instead of local state:

```bash
# 1. Create S3 bucket
aws s3 mb s3://your-terraform-state-bucket
aws s3api put-bucket-versioning --bucket your-terraform-state-bucket --versioning-configuration Status=Enabled

# 2. Create DynamoDB table for locking
aws dynamodb create-table \
  --table-name terraform-state-locks \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5

# 3. Update TERRAFORM_STATE_BUCKET in .env
# The deploy script will automatically configure the backend
```

## Monitoring and Troubleshooting

### CloudWatch Logs
- **Frontend**: `/ecs/todo-app-{env}-frontend`
- **Backend**: `/ecs/todo-app-{env}-backend`

### Get Application URL
```bash
cd environments/dev
terraform output application_url
```

### Common Commands
```bash
# View current deployment
./deploy.sh dev plan

# Force service restart
aws ecs update-service --cluster todo-app-dev-cluster --service todo-app-dev-backend --force-new-deployment

# Check logs
aws logs get-log-events --log-group-name /ecs/todo-app-dev-backend --log-stream-name [stream-name]
```

## Auto Scaling

The infrastructure includes auto scaling based on:
- **Target**: 70% CPU utilization
- **Min Tasks**: 1 (dev), 2 (uat), 3 (prod)
- **Max Tasks**: 4 (dev), 6 (uat), 10 (prod)

## Security Features

- ✅ **Encryption**: All traffic encrypted in transit (HTTPS/TLS)
- ✅ **Network**: Database in private subnets only
- ✅ **Secrets**: Stored in AWS Secrets Manager
- ✅ **Scanning**: ECR image vulnerability scanning enabled
- ✅ **Access**: Least privilege IAM roles

## Cost Optimization

- **Fargate Spot**: Available for non-critical environments
- **RDS**: Right-sized instances per environment
- **Auto Scaling**: Scales down during low usage
- **CloudWatch**: Monitors and optimizes resource usage

## Cleanup

```bash
./deploy.sh dev destroy   # Destroy development environment
./deploy.sh uat destroy   # Destroy UAT environment  
./deploy.sh prod destroy  # Destroy production environment
```

## Key Benefits

✅ **No Hardcoding**: Environment variables for all configuration  
✅ **Multi-Account**: Deploy to different AWS accounts easily  
✅ **Git Safe**: Sensitive data never committed  
✅ **Team Friendly**: Each developer has own `.env` file  
✅ **CI/CD Ready**: Works with environment variables  
✅ **Region Flexible**: Deploy to any AWS region  
✅ **Auto Scaling**: Handles traffic spikes automatically  
✅ **Secure**: Best practices for AWS security

## Files Reference

| File | Purpose |
|------|---------|
| `.env` | Your configuration (created from template, gitignored) |
| `.env.template` | Configuration template |
| `configure-env.sh` | Interactive environment setup |
| `generate-tfvars.sh` | Generate Terraform variables from .env |
| `deploy.sh` | Main deployment script |
| `build-and-push.sh` | Build and push Docker images |
| `setup-guide.sh` | Quick start guide |

## Need Help?

1. **Quick Start**: Run `./setup-guide.sh`
2. **Configuration**: Edit `.env` file
3. **Deployment Issues**: Check `terraform plan` output
4. **Application Issues**: Check CloudWatch logs

---

**Example Deployment**: Your app will be available at URLs like:
- Dev: `http://todo-app-dev-alb-xxxxx.region.elb.amazonaws.com`
- Prod: `https://yourdomain.com` (if domain configured)
