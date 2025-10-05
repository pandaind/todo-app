#!/bin/bash

# Quick verification script to check if any todo-app resources remain
echo "🔍 Quick verification scan for remaining todo-app resources..."

# Check most common regions where resources might remain
REGIONS=("us-east-1" "us-west-2" "ap-south-1" "eu-west-1")
PATTERNS=("todo" "terraform" "lock")
FOUND_RESOURCES=false

for region in "${REGIONS[@]}"; do
    echo "Checking $region..."
    
    # Check S3 (global)
    if [ "$region" = "us-east-1" ]; then
        s3_buckets=$(aws s3 ls | grep -E "(todo|terraform)" || true)
        if [ -n "$s3_buckets" ]; then
            echo "❌ Found S3 buckets: $s3_buckets"
            FOUND_RESOURCES=true
        fi
    fi
    
    # Check ECS
    ecs_clusters=$(aws ecs list-clusters --region "$region" --query 'clusterArns[*]' --output text 2>/dev/null | grep -E "(todo|terraform)" || true)
    if [ -n "$ecs_clusters" ]; then
        echo "❌ Found ECS clusters in $region: $ecs_clusters"
        FOUND_RESOURCES=true
    fi
    
    # Check DynamoDB
    dynamo_tables=$(aws dynamodb list-tables --region "$region" --query 'TableNames[*]' --output text 2>/dev/null | tr '\t' '\n' | grep -E "(todo|terraform|lock)" || true)
    if [ -n "$dynamo_tables" ]; then
        echo "❌ Found DynamoDB tables in $region: $dynamo_tables"
        FOUND_RESOURCES=true
    fi
    
    # Check CloudWatch Logs
    log_groups=$(aws logs describe-log-groups --region "$region" --query 'logGroups[*].logGroupName' --output text 2>/dev/null | tr '\t' '\n' | grep -E "(todo|ecs)" || true)
    if [ -n "$log_groups" ]; then
        echo "❌ Found Log Groups in $region: $log_groups"
        FOUND_RESOURCES=true
    fi
    
    # Check ECR
    ecr_repos=$(aws ecr describe-repositories --region "$region" --query 'repositories[*].repositoryName' --output text 2>/dev/null | tr '\t' '\n' | grep -E "(todo|terraform)" || true)
    if [ -n "$ecr_repos" ]; then
        echo "❌ Found ECR repositories in $region: $ecr_repos"
        FOUND_RESOURCES=true
    fi
done

if [ "$FOUND_RESOURCES" = false ]; then
    echo "✅ All clear! No todo-app related resources found."
    echo "🎉 Your AWS account is clean of todo-app resources."
else
    echo "❌ Some resources were found. Run the full cleanup script to remove them."
fi