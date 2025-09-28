terraform {
  # Using local backend for development environment
  # For production, consider using S3 backend with proper access controls
  backend "local" {
    path = "terraform.tfstate"
  }
}

# Import blocks for existing resources (Terraform 1.5+)
module "todo_app" {
  source = "../../"

  # Environment specific variables
  environment    = var.environment
  aws_region     = var.aws_region
  project_name   = var.project_name
  
  # VPC Configuration
  vpc_cidr           = var.vpc_cidr
  availability_zones = var.availability_zones
  
  # Docker Images - from terraform.tfvars
  frontend_image = var.frontend_image
  backend_image  = var.backend_image
  
  # Service Configuration
  frontend_desired_count = 1
  backend_desired_count  = 1
  frontend_cpu          = var.frontend_cpu
  frontend_memory       = var.frontend_memory
  backend_cpu           = var.backend_cpu
  backend_memory        = var.backend_memory
  
  # Database Configuration
  db_instance_class     = var.db_instance_class
  db_allocated_storage  = 20
  
  # Domain and SSL (optional for dev)
  domain_name     = var.domain_name
  certificate_arn = var.certificate_arn
  
  tags = var.tags
}
