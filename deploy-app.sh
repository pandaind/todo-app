#!/bin/bash
set -e

echo "Building production images..."
docker build -f backend/Dockerfile.prod -t todo-backend:latest backend/
docker build -f frontend/Dockerfile.prod -t todo-frontend:latest frontend/

echo "Deploying backend..."
kubectl apply -f k8s-backend.yaml

echo "Deploying frontend..."
kubectl apply -f k8s-frontend.yaml

echo "Creating ingress..."
kubectl apply -f k8s-ingress.yaml

echo "Waiting for deployments to be ready..."
kubectl wait --for=condition=available --timeout=120s deployment/todo-backend
kubectl wait --for=condition=available --timeout=120s deployment/todo-frontend

echo "Todo App deployed successfully!"
echo "Access at: http://todo.local (add to /etc/hosts if needed)"
echo "Backend health: kubectl get pods -l app=todo-backend"
echo "Frontend health: kubectl get pods -l app=todo-frontend"
