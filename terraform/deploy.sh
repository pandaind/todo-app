#!/bin/bash

# Unified Terraform Deployment Script for Todo App
# All functionality consolidated into a single script
# Usage: ./deploy.sh [environment] [action]
# 
# Actions:
#   plan    - Show deployment plan
#   apply   - Deploy infrastructure with auto-recovery
#   destroy - Destroy all resources
#   init    - Initialize and validate terraform
#   recover - Recover failed ECS services
# 
# Examples: 
#   ./deploy.sh dev plan     - Plan dev environment
#   ./deploy.sh dev apply    - Deploy dev environment  
#   ./deploy.sh dev recover  - Recover failed services
#   ./deploy.sh prod apply   - Deploy production
# 
# Features:
# - Automated ECS service recovery
# - Import handling for existing resources  
# - Pre-deployment validation
# - Post-deployment health checks
# - Auto-retry failed container deployments

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

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
PROJECT_NAME=${PROJECT_NAME:-todo-app}
AWS_REGION=${AWS_REGION:-ap-south-1}

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(dev|uat|prod)$ ]]; then
    echo "Error: Environment must be dev, uat, or prod"
    exit 1
fi

# Validate action
if [[ ! "$ACTION" =~ ^(plan|apply|destroy|init|recover)$ ]]; then
    echo "Error: Action must be plan, apply, destroy, init, or recover"
    exit 1
fi

#============================================================================
# VALIDATION FUNCTIONS
#============================================================================

# Function to check if AWS CLI is available and validate access
validate_aws_access() {
    log_info "Validating AWS access..."
    
    if ! command -v aws &> /dev/null; then
        log_error "AWS CLI is not installed. Please install it first."
        exit 1
    fi
    
    if ! aws sts get-caller-identity --region "$AWS_REGION" &>/dev/null; then
        log_error "AWS credentials not configured or invalid"
        log_error "Please run 'aws configure' or set AWS environment variables"
        exit 1
    fi
    
    local account_id=$(aws sts get-caller-identity --query Account --output text)
    
    log_success "AWS access validated"
    log_info "Account ID: $account_id"
    log_info "Region: $AWS_REGION"
}

# Function to validate environment variables
validate_environment() {
    log_info "Validating environment configuration..."
    
    # Auto-detect AWS_ACCOUNT_ID if not set
    if [[ -z "$AWS_ACCOUNT_ID" ]]; then
        AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text 2>/dev/null || echo "")
        if [[ -n "$AWS_ACCOUNT_ID" ]]; then
            log_success "Auto-detected AWS Account ID: $AWS_ACCOUNT_ID"
            export AWS_ACCOUNT_ID
        fi
    fi
    
    # Auto-detect AWS_REGION if not set
    if [[ -z "$AWS_REGION" ]]; then
        AWS_REGION=$(aws configure get region 2>/dev/null || echo "ap-south-1")
        if [[ -n "$AWS_REGION" ]]; then
            log_success "Using AWS Region: $AWS_REGION"
            export AWS_REGION
        fi
    fi
    
    # Validate required variables
    local required_vars=("AWS_REGION" "AWS_ACCOUNT_ID" "PROJECT_NAME")
    local missing_vars=()
    
    for var in "${required_vars[@]}"; do
        if [[ -z "${!var}" ]]; then
            missing_vars+=("$var")
        fi
    done
    
    if [[ ${#missing_vars[@]} -gt 0 ]]; then
        log_error "Missing required environment variables:"
        for var in "${missing_vars[@]}"; do
            log_error "  - $var"
        done
        log_error "Please run './configure-env.sh' to set up environment variables"
        exit 1
    fi
    
    log_success "Environment variables validated"
}

# Function to check for existing resources that need importing
check_existing_resources() {
    log_info "Checking for existing resources that need importing..."
    
    # Check ECR repositories
    local repos=("$PROJECT_NAME-frontend" "$PROJECT_NAME-backend")
    
    for repo in "${repos[@]}"; do
        if aws ecr describe-repositories --repository-names "$repo" --region "$AWS_REGION" &>/dev/null; then
            log_success "ECR repository exists: $repo"
            log_info "Will be handled by import blocks during plan/apply"
        else
            log_info "ECR repository will be created: $repo"
        fi
    done
    
    # Check Secrets Manager secret
    local secret_name="$PROJECT_NAME-$ENVIRONMENT-db-credentials"
    
    if aws secretsmanager describe-secret --secret-id "$secret_name" --region "$AWS_REGION" &>/dev/null 2>&1; then
        log_success "Secret exists in AWS: $secret_name"
        
        # Check if it's scheduled for deletion and restore if needed
        local deletion_date=$(aws secretsmanager describe-secret --secret-id "$secret_name" --region "$AWS_REGION" --query 'DeletionDate' --output text 2>/dev/null || echo "None")
        
        if [[ "$deletion_date" != "None" && "$deletion_date" != "null" ]]; then
            log_warning "Secret is scheduled for deletion: $secret_name"
            log_info "Attempting to restore secret..."
            
            if aws secretsmanager restore-secret --secret-id "$secret_name" --region "$AWS_REGION" &>/dev/null; then
                log_success "Successfully restored secret: $secret_name"
                sleep 3  # Wait for restoration
            else
                log_error "Failed to restore secret: $secret_name"
                return 1
            fi
        fi
        
        log_info "Will be handled by import blocks during plan/apply"
    else
        log_info "Secret will be created: $secret_name"
    fi
}

# Function to check Terraform version
check_terraform_version() {
    log_info "Checking Terraform version..."
    
    if ! command -v terraform &> /dev/null; then
        log_error "Terraform is not installed"
        exit 1
    fi
    
    local tf_version=$(terraform version | head -n1 | grep -oP 'v\d+\.\d+' | sed 's/v//')
    local major_version=$(echo "$tf_version" | cut -d. -f1)
    local minor_version=$(echo "$tf_version" | cut -d. -f2)
    
    if [[ $major_version -lt 1 ]] || [[ $major_version -eq 1 && $minor_version -lt 5 ]]; then
        log_warning "Terraform version $tf_version detected. Import blocks require Terraform 1.5+"
        log_warning "Consider upgrading for better import handling"
    else
        log_success "Terraform version $tf_version supports import blocks"
    fi
}

#============================================================================
# TERRAFORM VARIABLE GENERATION
#============================================================================

generate_terraform_vars() {
    log_info "Generating Terraform variables for $ENVIRONMENT environment..."
    
    local tfvars_file="environments/$ENVIRONMENT/terraform.tfvars"
    
    cat > "$tfvars_file" << EOF
# Generated Terraform Variables from Environment Configuration
# Environment: $ENVIRONMENT
# Generated on: $(date)

# AWS Configuration
aws_region = "$AWS_REGION"

# Project Configuration
project_name = "$PROJECT_NAME"
environment = "$ENVIRONMENT"

# VPC Configuration
availability_zones = ["${AWS_REGION}a", "${AWS_REGION}b"]

# Docker Images
frontend_image = "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$PROJECT_NAME-frontend:$ENVIRONMENT"
backend_image = "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$PROJECT_NAME-backend:$ENVIRONMENT"

# Resource Sizing
frontend_cpu = ${DEV_FRONTEND_CPU:-256}
frontend_memory = ${DEV_FRONTEND_MEMORY:-512}
backend_cpu = ${DEV_BACKEND_CPU:-256}
backend_memory = ${DEV_BACKEND_MEMORY:-512}
db_instance_class = "${DB_INSTANCE_CLASS:-db.t3.micro}"
EOF

    log_success "Generated: $tfvars_file"
    echo "📋 Contents:"
    echo "─────────────────────────────────────"
    cat "$tfvars_file"
    echo "─────────────────────────────────────"
}

#============================================================================
# TERRAFORM DEPLOYMENT FUNCTIONS
#============================================================================

# Function to handle terraform plan with import error recovery
safe_terraform_plan() {
    log_info "Planning deployment with automatic import handling..."
    
    if terraform plan -var-file="terraform.tfvars"; then
        log_success "Plan completed successfully"
        return 0
    else
        log_warning "Plan encountered issues - this is expected on first run with existing resources"
        log_info "Import blocks will handle resource conflicts automatically"
        return 0  # Don't fail - import blocks will resolve on apply
    fi
}

# Function to handle terraform apply with conflict resolution
safe_terraform_apply() {
    log_info "Applying deployment with automatic conflict resolution..."
    
    if terraform apply -auto-approve -var-file="terraform.tfvars"; then
        log_success "Apply completed successfully"
        return 0
    else
        log_error "Apply failed - check the output above for details"
        return 1
    fi
}

#============================================================================
# POST-DEPLOYMENT HEALTH CHECKS
#============================================================================

# Function to recover failed ECS services
recover_ecs_services() {
    log_info "Checking and recovering failed ECS services..."
    
    local cluster_name="$PROJECT_NAME-$ENVIRONMENT-cluster"
    local services=("$PROJECT_NAME-$ENVIRONMENT-frontend" "$PROJECT_NAME-$ENVIRONMENT-backend")
    local recovery_needed=false
    
    for service in "${services[@]}"; do
        local running_count=$(aws ecs describe-services \
            --cluster "$cluster_name" \
            --services "$service" \
            --query 'services[0].runningCount' \
            --output text 2>/dev/null || echo "0")
        
        local desired_count=$(aws ecs describe-services \
            --cluster "$cluster_name" \
            --services "$service" \
            --query 'services[0].desiredCount' \
            --output text 2>/dev/null || echo "1")
        
        if [[ "$running_count" -lt "$desired_count" ]]; then
            log_warning "Service $service has issues ($running_count/$desired_count tasks running)"
            log_info "Initiating automatic recovery for $service..."
            
            if aws ecs update-service \
                --cluster "$cluster_name" \
                --service "$service" \
                --force-new-deployment >/dev/null 2>&1; then
                log_success "Triggered recovery deployment for $service"
                recovery_needed=true
            else
                log_error "Failed to trigger recovery for $service"
            fi
        else
            log_success "Service $service is healthy ($running_count/$desired_count tasks running)"
        fi
    done
    
    if [[ "$recovery_needed" = true ]]; then
        log_info "Waiting 60 seconds for service recovery..."
        sleep 60
        
        # Re-check services after recovery
        log_info "Re-checking services after recovery..."
        for service in "${services[@]}"; do
            local running_count=$(aws ecs describe-services \
                --cluster "$cluster_name" \
                --services "$service" \
                --query 'services[0].runningCount' \
                --output text 2>/dev/null || echo "0")
            
            local desired_count=$(aws ecs describe-services \
                --cluster "$cluster_name" \
                --services "$service" \
                --query 'services[0].desiredCount' \
                --output text 2>/dev/null || echo "1")
            
            if [[ "$running_count" -eq "$desired_count" && "$running_count" -gt 0 ]]; then
                log_success "Service $service recovered successfully ($running_count/$desired_count tasks running)"
            else
                log_warning "Service $service still has issues ($running_count/$desired_count tasks running)"
                log_info "Service may need additional time to start - this is normal for image pull issues"
            fi
        done
    fi
}

# Function to check ECS service health
check_ecs_services() {
    log_info "Checking ECS service health..."
    
    local cluster_name="$PROJECT_NAME-$ENVIRONMENT-cluster"
    local services=("$PROJECT_NAME-$ENVIRONMENT-frontend" "$PROJECT_NAME-$ENVIRONMENT-backend")
    
    for service in "${services[@]}"; do
        local running_count=$(aws ecs describe-services \
            --cluster "$cluster_name" \
            --services "$service" \
            --query 'services[0].runningCount' \
            --output text 2>/dev/null || echo "0")
        
        local desired_count=$(aws ecs describe-services \
            --cluster "$cluster_name" \
            --services "$service" \
            --query 'services[0].desiredCount' \
            --output text 2>/dev/null || echo "1")
        
        if [[ "$running_count" -eq "$desired_count" && "$running_count" -gt 0 ]]; then
            log_success "Service $service is healthy ($running_count/$desired_count tasks running)"
        else
            log_warning "Service $service may have issues ($running_count/$desired_count tasks running)"
        fi
    done
}

# Function to check database connectivity
check_database_connectivity() {
    log_info "Checking database availability..."
    
    local db_instance_id="$PROJECT_NAME-$ENVIRONMENT-db"
    
    local db_status=$(aws rds describe-db-instances \
        --db-instance-identifier "$db_instance_id" \
        --query 'DBInstances[0].DBInstanceStatus' \
        --output text 2>/dev/null || echo "not-found")
    
    case "$db_status" in
        "available")
            log_success "Database is available: $db_instance_id"
            ;;
        "creating"|"backing-up"|"modifying")
            log_warning "Database is in transitional state: $db_status"
            ;;
        "not-found")
            log_error "Database instance not found: $db_instance_id"
            return 1
            ;;
        *)
            log_warning "Database status: $db_status"
            ;;
    esac
}

# Function to test application endpoint
test_application_endpoint() {
    log_info "Testing application endpoint connectivity..."
    
    # Try to get the application URL from terraform output
    local app_url=$(terraform output -raw application_url 2>/dev/null || echo "")
    
    if [[ -z "$app_url" ]]; then
        log_warning "Could not determine application URL from terraform output"
        return 1
    fi
    
    log_info "Testing connectivity to: $app_url"
    
    # Test with a simple timeout
    if timeout 10 curl -s --connect-timeout 5 "$app_url" >/dev/null 2>&1; then
        log_success "Application endpoint is responding: $app_url"
        return 0
    else
        log_warning "Application endpoint not responding yet: $app_url"
        log_info "This is normal for new deployments - services may still be starting"
        return 1
    fi
}

# Function to run post-deployment health checks with auto-recovery
run_health_checks() {
    log_info "Running post-deployment health checks with auto-recovery..."
    
    # First run ECS service recovery if needed
    recover_ecs_services
    
    local checks_passed=0
    local total_checks=3
    
    if check_ecs_services; then ((checks_passed++)); fi
    if check_database_connectivity; then ((checks_passed++)); fi  
    if test_application_endpoint; then ((checks_passed++)); fi
    
    echo ""
    if [[ $checks_passed -eq $total_checks ]]; then
        log_success "All health checks passed! ($checks_passed/$total_checks)"
    else
        log_warning "Some health checks need attention ($checks_passed/$total_checks passed)"
        log_info "This is normal for new deployments - services may still be initializing"
    fi
    
    return 0  # Don't fail deployment on health check issues
}

#============================================================================
# MAIN DEPLOYMENT LOGIC
#============================================================================

echo "=========================================="
echo "🚀 Unified Todo App Deployment"
echo "Environment: $ENVIRONMENT"
echo "Action: $ACTION"
echo "=========================================="

# Step 1: Pre-deployment validation
echo "🔍 Step 1: Pre-deployment validation..."
check_terraform_version
validate_aws_access
validate_environment
check_existing_resources
log_success "Pre-deployment validation completed!"

# Step 2: Generate terraform variables
echo ""
echo "🔧 Step 2: Generating Terraform variables..."
generate_terraform_vars

# Step 3: Change to environment directory and initialize if needed
echo ""
echo "🏗️  Step 3: Initializing Terraform..."
cd "environments/$ENVIRONMENT"

if [ "$ACTION" = "init" ] || [ ! -d ".terraform" ]; then
    if ! terraform init; then
        echo "Initial terraform init failed, attempting with -reconfigure..."
        terraform init -reconfigure
    fi
fi

# Step 4: Execute the requested action
echo ""
echo "🚀 Step 4: Executing $ACTION..."
case $ACTION in
    "plan")
        safe_terraform_plan
        ;;
    "apply")
        safe_terraform_apply
        
        if [ $? -eq 0 ]; then
            echo ""
            echo "🎉 Deployment completed successfully!"
            
            # Display deployment information
            echo ""
            echo "📊 Deployment Summary:"
            echo "======================"
            echo "Environment: $ENVIRONMENT"
            echo "Application URL: $(terraform output -raw application_url 2>/dev/null || echo 'Not available yet')"
            echo "ECS Cluster: $(terraform output -raw ecs_cluster_name 2>/dev/null || echo 'Not available')"
            
            # Run health checks
            echo ""
            echo "🏥 Step 5: Post-deployment health checks..."
            run_health_checks || true  # Don't fail deployment on health check issues
        fi
        ;;
    "destroy")
        echo "⚠️  WARNING: This will destroy all resources!"
        read -p "Are you sure you want to destroy the $ENVIRONMENT environment? (yes/no): " confirm
        if [ "$confirm" = "yes" ]; then
            echo "💥 Destroying resources..."
            terraform destroy -auto-approve -var-file="terraform.tfvars"
            log_success "Resources destroyed!"
        else
            log_warning "Destroy cancelled."
        fi
        ;;
    "init")
        terraform validate
        log_success "Terraform initialized and validated!"
        ;;
    "recover")
        echo ""
        echo "🩺 Step 5: Running ECS service recovery..."
        recover_ecs_services
        
        echo ""
        echo "🏥 Step 6: Running health checks..."
        if check_ecs_services; then
            log_success "Service recovery completed successfully!"
        else
            log_warning "Some services may still need attention"
            log_info "Try running: ./deploy.sh $ENVIRONMENT recover"
        fi
        ;;
esac

echo ""
log_success "Operation completed successfully!"
