#!/bin/bash
set -e

echo "Cleaning up operator resources..."
kubectl delete -f example-todoapp.yaml || true
kubectl delete -f operator-deployment.yaml || true
kubectl delete -f rbac.yaml || true
kubectl delete -f todoapp_crd.yaml || true

echo "Cleanup complete!"
