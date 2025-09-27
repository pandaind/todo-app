# Data sources
data "aws_availability_zones" "available" {
  state = "available"
}

locals {
  availability_zones = slice(data.aws_availability_zones.available.names, 0, 2)
  
  common_tags = merge(var.tags, {
    Project     = var.project_name
    Environment = var.environment
    ManagedBy   = "Terraform"
  })
}

# Networking
module "networking" {
  source = "./modules/networking"

  project_name       = var.project_name
  environment        = var.environment
  vpc_cidr          = var.vpc_cidr
  availability_zones = local.availability_zones
}

# Application Load Balancer
module "alb" {
  source = "./modules/alb"

  project_name       = var.project_name
  environment        = var.environment
  vpc_id            = module.networking.vpc_id
  public_subnet_ids = module.networking.public_subnet_ids
  certificate_arn   = var.certificate_arn
  domain_name       = var.domain_name
}

# Security Group for ECS Tasks (created before RDS to avoid cycle)
resource "aws_security_group" "ecs_tasks" {
  name        = "${var.project_name}-${var.environment}-ecs-tasks-sg"
  description = "Allow inbound access from the ALB only"
  vpc_id      = module.networking.vpc_id

  ingress {
    protocol        = "tcp"
    from_port       = var.frontend_port
    to_port         = var.frontend_port
    security_groups = [module.alb.alb_security_group_id]
  }

  ingress {
    protocol        = "tcp"
    from_port       = var.backend_port
    to_port         = var.backend_port
    security_groups = [module.alb.alb_security_group_id]
  }

  egress {
    protocol         = "-1"
    from_port        = 0
    to_port          = 0
    cidr_blocks      = ["0.0.0.0/0"]
    ipv6_cidr_blocks = ["::/0"]
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-ecs-tasks-sg"
  }
}

# RDS Database
module "rds" {
  source = "./modules/rds"

  project_name               = var.project_name
  environment               = var.environment
  vpc_id                    = module.networking.vpc_id
  db_subnet_group_name      = module.networking.db_subnet_group_name
  instance_class            = var.db_instance_class
  allocated_storage         = var.db_allocated_storage
  allowed_security_groups   = [aws_security_group.ecs_tasks.id]

  depends_on = [module.networking]
}

# ECS Cluster and Services
module "ecs" {
  source = "./modules/ecs"

  project_name               = var.project_name
  environment               = var.environment
  vpc_id                    = module.networking.vpc_id
  private_subnet_ids        = module.networking.private_subnet_ids
  alb_security_group_id     = module.alb.alb_security_group_id
  ecs_security_group_id     = aws_security_group.ecs_tasks.id
  db_security_group_id      = module.rds.db_security_group_id
  
  frontend_image            = var.frontend_image
  backend_image             = var.backend_image
  frontend_port             = var.frontend_port
  backend_port              = var.backend_port
  frontend_desired_count    = var.frontend_desired_count
  backend_desired_count     = var.backend_desired_count
  frontend_cpu              = var.frontend_cpu
  frontend_memory           = var.frontend_memory
  backend_cpu               = var.backend_cpu
  backend_memory            = var.backend_memory
  
  frontend_target_group_arn = module.alb.frontend_target_group_arn
  backend_target_group_arn  = module.alb.backend_target_group_arn
  
  alb_dns_name              = module.alb.alb_dns_name
  db_credentials_secret_arn = module.rds.db_credentials_secret_arn
  db_endpoint               = module.rds.db_instance_endpoint
  database_name             = module.rds.database_name

  depends_on = [module.networking, module.alb, module.rds]
}

# Route53 Record (if domain name is provided)
resource "aws_route53_record" "main" {
  count = var.domain_name != "" ? 1 : 0

  zone_id = data.aws_route53_zone.main[0].zone_id
  name    = var.environment == "prod" ? var.domain_name : "${var.environment}.${var.domain_name}"
  type    = "A"

  alias {
    name                   = module.alb.alb_dns_name
    zone_id                = module.alb.alb_zone_id
    evaluate_target_health = true
  }
}

data "aws_route53_zone" "main" {
  count = var.domain_name != "" ? 1 : 0

  name         = var.domain_name
  private_zone = false
}
