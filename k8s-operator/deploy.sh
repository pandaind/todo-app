#!/bin/bash
set -e

echo "Building operator image..."
docker build -t todo-operator:latest .

echo "Applying CRD..."
kubectl apply -f todoapp_crd.yaml

echo "Applying RBAC..."
kubectl apply -f rbac.yaml

echo "Deploying operator..."
kubectl apply -f operator-deployment.yaml

echo "Waiting for operator to be ready..."
kubectl wait --for=condition=available --timeout=60s deployment/todo-operator

echo "Creating example TodoApp resource..."
kubectl apply -f example-todoapp.yaml

echo "Operator deployed successfully!"
echo "Check operator logs: kubectl logs -f deployment/todo-operator"
echo "Check TodoApp resources: kubectl get todoapps"
