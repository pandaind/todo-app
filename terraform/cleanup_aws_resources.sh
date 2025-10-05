#!/bin/bash

# AWS Multi-Region Resource Cleanup Script for Todo App
# This script scans all AWS regions for remaining resources and offers to delete them

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SEARCH_PATTERNS=("todo" "terraform" "lock")
DRY_RUN=false
INTERACTIVE=true
LOG_FILE="aws_cleanup_$(date +%Y%m%d_%H%M%S).log"

# Function to log messages
log() {
    echo -e "$1" | tee -a "$LOG_FILE"
}

# Function to print section headers
print_header() {
    log "\n${BLUE}========================================${NC}"
    log "${BLUE} $1${NC}"
    log "${BLUE}========================================${NC}"
}

# Function to print region headers
print_region() {
    log "\n${YELLOW}--- Checking Region: $1 ---${NC}"
}

# Function to ask for confirmation
confirm() {
    if [ "$INTERACTIVE" = true ]; then
        read -p "$1 (y/N): " -n 1 -r
        echo
        [[ $REPLY =~ ^[Yy]$ ]]
    else
        true
    fi
}

# Function to check if resource name matches our patterns
matches_pattern() {
    local resource_name="$1"
    for pattern in "${SEARCH_PATTERNS[@]}"; do
        if [[ "$resource_name" == *"$pattern"* ]]; then
            return 0
        fi
    done
    return 1
}

# Function to delete ECS clusters
cleanup_ecs() {
    local region="$1"
    log "\n  Checking ECS clusters..."
    
    local clusters=$(aws ecs list-clusters --region "$region" --query 'clusterArns[*]' --output text 2>/dev/null || echo "")
    
    if [ -n "$clusters" ]; then
        for cluster_arn in $clusters; do
            local cluster_name=$(basename "$cluster_arn")
            if matches_pattern "$cluster_name"; then
                log "  ${RED}Found ECS cluster: $cluster_name${NC}"
                
                # First, stop all services in the cluster
                local services=$(aws ecs list-services --cluster "$cluster_arn" --region "$region" --query 'serviceArns[*]' --output text 2>/dev/null || echo "")
                if [ -n "$services" ]; then
                    for service_arn in $services; do
                        local service_name=$(basename "$service_arn")
                        log "    Stopping service: $service_name"
                        if [ "$DRY_RUN" = false ]; then
                            aws ecs update-service --cluster "$cluster_arn" --service "$service_arn" --desired-count 0 --region "$region" >/dev/null 2>&1 || true
                            aws ecs delete-service --cluster "$cluster_arn" --service "$service_arn" --region "$region" >/dev/null 2>&1 || true
                        fi
                    done
                fi
                
                if [ "$DRY_RUN" = false ] && confirm "  Delete ECS cluster $cluster_name?"; then
                    aws ecs delete-cluster --cluster "$cluster_arn" --region "$region" >/dev/null 2>&1 && \
                    log "  ${GREEN}✓ Deleted ECS cluster: $cluster_name${NC}" || \
                    log "  ${RED}✗ Failed to delete ECS cluster: $cluster_name${NC}"
                fi
            fi
        done
    fi
}

# Function to delete RDS instances
cleanup_rds() {
    local region="$1"
    log "\n  Checking RDS instances..."
    
    local instances=$(aws rds describe-db-instances --region "$region" --query 'DBInstances[*].DBInstanceIdentifier' --output text 2>/dev/null || echo "")
    
    for instance in $instances; do
        if matches_pattern "$instance"; then
            log "  ${RED}Found RDS instance: $instance${NC}"
            if [ "$DRY_RUN" = false ] && confirm "  Delete RDS instance $instance (skip final snapshot)?"; then
                aws rds delete-db-instance --db-instance-identifier "$instance" --skip-final-snapshot --region "$region" >/dev/null 2>&1 && \
                log "  ${GREEN}✓ Deleted RDS instance: $instance${NC}" || \
                log "  ${RED}✗ Failed to delete RDS instance: $instance${NC}"
            fi
        fi
    done
}

# Function to delete Load Balancers
cleanup_alb() {
    local region="$1"
    log "\n  Checking Application Load Balancers..."
    
    local lbs=$(aws elbv2 describe-load-balancers --region "$region" --query 'LoadBalancers[*].[LoadBalancerName,LoadBalancerArn]' --output text 2>/dev/null || echo "")
    
    while IFS=$'\t' read -r lb_name lb_arn; do
        if [ -n "$lb_name" ] && matches_pattern "$lb_name"; then
            log "  ${RED}Found Load Balancer: $lb_name${NC}"
            if [ "$DRY_RUN" = false ] && confirm "  Delete Load Balancer $lb_name?"; then
                aws elbv2 delete-load-balancer --load-balancer-arn "$lb_arn" --region "$region" >/dev/null 2>&1 && \
                log "  ${GREEN}✓ Deleted Load Balancer: $lb_name${NC}" || \
                log "  ${RED}✗ Failed to delete Load Balancer: $lb_name${NC}"
            fi
        fi
    done <<< "$lbs"
}

# Function to delete ECR repositories
cleanup_ecr() {
    local region="$1"
    log "\n  Checking ECR repositories..."
    
    local repos=$(aws ecr describe-repositories --region "$region" --query 'repositories[*].repositoryName' --output text 2>/dev/null || echo "")
    
    for repo in $repos; do
        if matches_pattern "$repo"; then
            log "  ${RED}Found ECR repository: $repo${NC}"
            if [ "$DRY_RUN" = false ] && confirm "  Delete ECR repository $repo (with all images)?"; then
                aws ecr delete-repository --repository-name "$repo" --force --region "$region" >/dev/null 2>&1 && \
                log "  ${GREEN}✓ Deleted ECR repository: $repo${NC}" || \
                log "  ${RED}✗ Failed to delete ECR repository: $repo${NC}"
            fi
        fi
    done
}

# Function to delete DynamoDB tables
cleanup_dynamodb() {
    local region="$1"
    log "\n  Checking DynamoDB tables..."
    
    local tables=$(aws dynamodb list-tables --region "$region" --query 'TableNames[*]' --output text 2>/dev/null || echo "")
    
    for table in $tables; do
        if matches_pattern "$table"; then
            log "  ${RED}Found DynamoDB table: $table${NC}"
            if [ "$DRY_RUN" = false ] && confirm "  Delete DynamoDB table $table?"; then
                aws dynamodb delete-table --table-name "$table" --region "$region" >/dev/null 2>&1 && \
                log "  ${GREEN}✓ Deleted DynamoDB table: $table${NC}" || \
                log "  ${RED}✗ Failed to delete DynamoDB table: $table${NC}"
            fi
        fi
    done
}

# Function to delete CloudWatch Log Groups
cleanup_cloudwatch() {
    local region="$1"
    log "\n  Checking CloudWatch Log Groups..."
    
    local log_groups=$(aws logs describe-log-groups --region "$region" --query 'logGroups[*].logGroupName' --output text 2>/dev/null || echo "")
    
    for log_group in $log_groups; do
        if matches_pattern "$log_group"; then
            log "  ${RED}Found Log Group: $log_group${NC}"
            if [ "$DRY_RUN" = false ] && confirm "  Delete Log Group $log_group?"; then
                aws logs delete-log-group --log-group-name "$log_group" --region "$region" >/dev/null 2>&1 && \
                log "  ${GREEN}✓ Deleted Log Group: $log_group${NC}" || \
                log "  ${RED}✗ Failed to delete Log Group: $log_group${NC}"
            fi
        fi
    done
}

# Function to delete Security Groups (non-default)
cleanup_security_groups() {
    local region="$1"
    log "\n  Checking Security Groups..."
    
    local sgs=$(aws ec2 describe-security-groups --region "$region" --query 'SecurityGroups[?GroupName!=`default`].[GroupId,GroupName]' --output text 2>/dev/null || echo "")
    
    while IFS=$'\t' read -r sg_id sg_name; do
        if [ -n "$sg_name" ] && matches_pattern "$sg_name"; then
            log "  ${RED}Found Security Group: $sg_name ($sg_id)${NC}"
            if [ "$DRY_RUN" = false ] && confirm "  Delete Security Group $sg_name?"; then
                aws ec2 delete-security-group --group-id "$sg_id" --region "$region" >/dev/null 2>&1 && \
                log "  ${GREEN}✓ Deleted Security Group: $sg_name${NC}" || \
                log "  ${RED}✗ Failed to delete Security Group: $sg_name${NC}"
            fi
        fi
    done <<< "$sgs"
}

# Function to delete VPCs (non-default)
cleanup_vpcs() {
    local region="$1"
    log "\n  Checking VPCs..."
    
    local vpcs=$(aws ec2 describe-vpcs --region "$region" --query 'Vpcs[?IsDefault==`false`].[VpcId,Tags[?Key==`Name`].Value|[0]]' --output text 2>/dev/null || echo "")
    
    while IFS=$'\t' read -r vpc_id vpc_name; do
        if [ -n "$vpc_name" ] && matches_pattern "$vpc_name"; then
            log "  ${RED}Found VPC: $vpc_name ($vpc_id)${NC}"
            if [ "$DRY_RUN" = false ] && confirm "  Delete VPC $vpc_name (this will delete associated subnets, route tables, etc.)?"; then
                # This is complex and dangerous - VPCs have many dependencies
                log "  ${YELLOW}⚠ VPC deletion requires manual cleanup of dependencies${NC}"
                log "  ${YELLOW}  Please delete manually: VPC $vpc_name ($vpc_id)${NC}"
            fi
        fi
    done <<< "$vpcs"
}

# Function to delete Secrets Manager secrets
cleanup_secrets() {
    local region="$1"
    log "\n  Checking Secrets Manager..."
    
    local secrets=$(aws secretsmanager list-secrets --region "$region" --query 'SecretList[*].[Name,ARN]' --output text 2>/dev/null || echo "")
    
    while IFS=$'\t' read -r secret_name secret_arn; do
        if [ -n "$secret_name" ] && matches_pattern "$secret_name"; then
            log "  ${RED}Found Secret: $secret_name${NC}"
            if [ "$DRY_RUN" = false ] && confirm "  Delete Secret $secret_name?"; then
                aws secretsmanager delete-secret --secret-id "$secret_arn" --force-delete-without-recovery --region "$region" >/dev/null 2>&1 && \
                log "  ${GREEN}✓ Deleted Secret: $secret_name${NC}" || \
                log "  ${RED}✗ Failed to delete Secret: $secret_name${NC}"
            fi
        fi
    done <<< "$secrets"
}

# Function to check global services
cleanup_global_services() {
    print_header "CHECKING GLOBAL SERVICES"
    
    # S3 buckets (global but need to check each region for bucket location)
    log "\nChecking S3 buckets..."
    local buckets=$(aws s3api list-buckets --query 'Buckets[*].Name' --output text 2>/dev/null || echo "")
    
    for bucket in $buckets; do
        if matches_pattern "$bucket"; then
            log "${RED}Found S3 bucket: $bucket${NC}"
            if [ "$DRY_RUN" = false ] && confirm "Delete S3 bucket $bucket (with all contents)?"; then
                aws s3 rb "s3://$bucket" --force >/dev/null 2>&1 && \
                log "${GREEN}✓ Deleted S3 bucket: $bucket${NC}" || \
                log "${RED}✗ Failed to delete S3 bucket: $bucket${NC}"
            fi
        fi
    done
    
    # IAM roles
    log "\nChecking IAM roles..."
    local roles=$(aws iam list-roles --query 'Roles[*].RoleName' --output text 2>/dev/null || echo "")
    
    for role in $roles; do
        if matches_pattern "$role"; then
            log "${RED}Found IAM role: $role${NC}"
            if [ "$DRY_RUN" = false ] && confirm "Delete IAM role $role?"; then
                # Detach policies first
                local attached_policies=$(aws iam list-attached-role-policies --role-name "$role" --query 'AttachedPolicies[*].PolicyArn' --output text 2>/dev/null || echo "")
                for policy_arn in $attached_policies; do
                    aws iam detach-role-policy --role-name "$role" --policy-arn "$policy_arn" >/dev/null 2>&1 || true
                done
                
                # Delete inline policies
                local inline_policies=$(aws iam list-role-policies --role-name "$role" --query 'PolicyNames[*]' --output text 2>/dev/null || echo "")
                for policy_name in $inline_policies; do
                    aws iam delete-role-policy --role-name "$role" --policy-name "$policy_name" >/dev/null 2>&1 || true
                done
                
                # Delete instance profiles
                local instance_profiles=$(aws iam list-instance-profiles-for-role --role-name "$role" --query 'InstanceProfiles[*].InstanceProfileName' --output text 2>/dev/null || echo "")
                for profile_name in $instance_profiles; do
                    aws iam remove-role-from-instance-profile --instance-profile-name "$profile_name" --role-name "$role" >/dev/null 2>&1 || true
                    aws iam delete-instance-profile --instance-profile-name "$profile_name" >/dev/null 2>&1 || true
                done
                
                aws iam delete-role --role-name "$role" >/dev/null 2>&1 && \
                log "${GREEN}✓ Deleted IAM role: $role${NC}" || \
                log "${RED}✗ Failed to delete IAM role: $role${NC}"
            fi
        fi
    done
    
    # Route53 hosted zones
    log "\nChecking Route53 hosted zones..."
    local hosted_zones=$(aws route53 list-hosted-zones --query 'HostedZones[*].[Name,Id]' --output text 2>/dev/null || echo "")
    
    while IFS=$'\t' read -r zone_name zone_id; do
        if [ -n "$zone_name" ] && matches_pattern "$zone_name"; then
            log "${RED}Found Route53 hosted zone: $zone_name${NC}"
            if [ "$DRY_RUN" = false ] && confirm "Delete Route53 hosted zone $zone_name?"; then
                log "${YELLOW}⚠ Route53 hosted zone deletion requires manual cleanup of records${NC}"
                log "${YELLOW}  Please delete manually: $zone_name ($zone_id)${NC}"
            fi
        fi
    done <<< "$hosted_zones"
}

# Function to process a single region
process_region() {
    local region="$1"
    print_region "$region"
    
    # Check if region is accessible
    if ! aws ec2 describe-regions --region-names "$region" >/dev/null 2>&1; then
        log "  ${YELLOW}⚠ Region $region not accessible, skipping${NC}"
        return
    fi
    
    cleanup_ecs "$region"
    cleanup_rds "$region"
    cleanup_alb "$region"
    cleanup_ecr "$region"
    cleanup_dynamodb "$region"
    cleanup_cloudwatch "$region"
    cleanup_security_groups "$region"
    cleanup_vpcs "$region"
    cleanup_secrets "$region"
}

# Main function
main() {
    print_header "AWS MULTI-REGION CLEANUP SCRIPT"
    log "Starting cleanup at $(date)"
    log "Log file: $LOG_FILE"
    
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --dry-run)
                DRY_RUN=true
                log "${YELLOW}DRY RUN MODE - No resources will be deleted${NC}"
                shift
                ;;
            --non-interactive)
                INTERACTIVE=false
                log "${YELLOW}NON-INTERACTIVE MODE - Will delete without confirmation${NC}"
                shift
                ;;
            --regions)
                IFS=',' read -ra REGIONS <<< "$2"
                shift 2
                ;;
            --help)
                echo "Usage: $0 [OPTIONS]"
                echo "Options:"
                echo "  --dry-run           Show what would be deleted without actually deleting"
                echo "  --non-interactive   Delete without asking for confirmation"
                echo "  --regions REGIONS   Comma-separated list of regions to check (default: all)"
                echo "  --help             Show this help message"
                exit 0
                ;;
            *)
                log "${RED}Unknown option: $1${NC}"
                exit 1
                ;;
        esac
    done
    
    # Get regions to check
    if [ ${#REGIONS[@]} -eq 0 ]; then
        REGIONS=($(aws ec2 describe-regions --query 'Regions[*].RegionName' --output text))
        log "Checking all available regions: ${REGIONS[*]}"
    else
        log "Checking specified regions: ${REGIONS[*]}"
    fi
    
    # Check global services first
    cleanup_global_services
    
    # Process each region
    print_header "CHECKING REGIONAL SERVICES"
    for region in "${REGIONS[@]}"; do
        process_region "$region"
    done
    
    print_header "CLEANUP COMPLETE"
    log "Cleanup completed at $(date)"
    log "Full log available in: $LOG_FILE"
    
    if [ "$DRY_RUN" = true ]; then
        log "${YELLOW}This was a dry run. To actually delete resources, run without --dry-run${NC}"
    fi
}

# Show usage if no AWS CLI
if ! command -v aws &> /dev/null; then
    echo "AWS CLI is not installed or not in PATH"
    exit 1
fi

# Declare regions array
declare -a REGIONS=()

# Run main function with all arguments
main "$@"