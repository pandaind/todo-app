terraform {
  backend "s3" {
    # Update these values with your S3 bucket details
    bucket = "todo-app"
    key    = "todo-app/uat/terraform.tfstate"
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
  id = "todo-app-uat-db-credentials"
}

module "todo_app" {
  source = "../../"

  # Environment specific variables
  environment    = "uat"
  aws_region     = "ap-south-1"
  project_name   = "todo-app"
  
  # VPC Configuration
  vpc_cidr           = "10.1.0.0/16"
  availability_zones = ["ap-south-1a", "ap-south-1b"]
  
  # Docker Images - Update these with your ECR repository URIs
  frontend_image = "073768867559.dkr.ecr.ap-south-1.amazonaws.com/todo-app-frontend:uat"
  backend_image  = "073768867559.dkr.ecr.ap-south-1.amazonaws.com/todo-app-backend:uat"
  
  # Service Configuration (moderate for UAT)
  frontend_desired_count = 2
  backend_desired_count  = 2
  frontend_cpu          = 256
  frontend_memory       = 512
  backend_cpu           = 512
  backend_memory        = 1024
  
  # Database Configuration (moderate for UAT)
  db_instance_class     = "db.t3.small"
  db_allocated_storage  = 50
  
  # Domain and SSL (optional for UAT)
  domain_name     = "yourdomain.com"  # Update with your domain
  certificate_arn = ""                # Update with your certificate ARN if available
  
  tags = {
    Environment = "uat"
    Owner       = "QATeam"
    CostCenter  = "Testing"
  }
}
