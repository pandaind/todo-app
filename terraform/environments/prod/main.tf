terraform {
  backend "s3" {
    # Update these values with your S3 bucket details
    bucket = "todo-app"
    key    = "todo-app/prod/terraform.tfstate"
    region = "ap-south-1"
    
    # Optional: DynamoDB table for state locking
    dynamodb_table = "terraform-state-locks"
    encrypt        = true
  }
}

# Import blocks for existing resources (Terraform 1.5+)
# These will automatically import resources if they exist but aren't in state

import {
  to = module.todo_app.aws_ecr_repository.frontend
  id = "todo-app-frontend"
}

import {
  to = module.todo_app.aws_ecr_repository.backend  
  id = "todo-app-backend"
}

import {
  to = module.todo_app.module.rds.aws_secretsmanager_secret.db_credentials
  id = "todo-app-prod-db-credentials"
}

module "todo_app" {
  source = "../../"

  # Environment specific variables
  environment    = "prod"
  aws_region     = "ap-south-1"
  project_name   = "todo-app"
  
  # VPC Configuration
  vpc_cidr           = "10.2.0.0/16"
  availability_zones = ["ap-south-1a", "ap-south-1b"]
  
  # Docker Images - Update these with your ECR repository URIs
  frontend_image = "073768867559.dkr.ecr.ap-south-1.amazonaws.com/todo-app-frontend:prod"
  backend_image  = "073768867559.dkr.ecr.ap-south-1.amazonaws.com/todo-app-backend:prod"
  
  # Service Configuration (higher for prod)
  frontend_desired_count = 3
  backend_desired_count  = 3
  frontend_cpu          = 512
  frontend_memory       = 1024
  backend_cpu           = 1024
  backend_memory        = 2048
  
  # Database Configuration (higher for prod)
  db_instance_class     = "db.t3.medium"
  db_allocated_storage  = 100
  
  # Domain and SSL (required for prod)
  domain_name     = "yourdomain.com"  # Update with your domain
  certificate_arn = "arn:aws:acm:ap-south-1:123456789012:certificate/your-certificate-id"  # Update with your certificate ARN
  
  tags = {
    Environment = "prod"
    Owner       = "DevOps"
    CostCenter  = "Production"
    Backup      = "Required"
    Monitoring  = "Critical"
  }
}
