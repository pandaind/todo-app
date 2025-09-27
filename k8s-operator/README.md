# Todo App Kubernetes Operator (Go)

This operator manages the lifecycle of your Todo App (backend + frontend) on Kubernetes using a custom resource.

## Features

- Watches `TodoApp` custom resources
- Automatically creates/updates backend and frontend deployments and services
- Supports configurable replicas and container images
- Production-ready with proper RBAC and resource limits
- Full reconciliation loop with error handling

## Structure

- `todoapp_crd.yaml`: Custom Resource Definition for TodoApp
- `main.go`: Operator implementation with full reconciliation logic
- `rbac.yaml`: ServiceAccount, ClusterRole, and ClusterRoleBinding for security
- `operator-deployment.yaml`: Kubernetes deployment for the operator
- `example-todoapp.yaml`: Example TodoApp custom resource
- `deploy.sh`: Automated deployment script
- `cleanup.sh`: Cleanup script for removing all resources
- `Dockerfile`: Multi-stage build for the Go operator

## Quick Start

1. Install Go 1.21+ and ensure you have kubectl access to a Kubernetes cluster

2. Deploy the complete operator:

   ```bash
   cd k8s-operator
   ./deploy.sh
   ```

   This script will:
   - Build the operator Docker image
   - Apply the Custom Resource Definition
   - Create RBAC resources (ServiceAccount, ClusterRole, ClusterRoleBinding)
   - Deploy the operator
   - Create an example TodoApp resource

3. Verify the deployment:

   ```bash
   kubectl get todoapps
   kubectl get deployments,services
   kubectl logs -f deployment/todo-operator
   ```

## Creating TodoApp Resources

Create a TodoApp custom resource to deploy your application:

```yaml
apiVersion: todoapp.github.com/v1alpha1
kind: TodoApp
metadata:
  name: my-todo-app
  namespace: default
spec:
  backend:
    image: todo-backend:latest
    replicas: 2
  frontend:
    image: todo-frontend:latest
    replicas: 2
```

Save as `my-todoapp.yaml` and apply:

```bash
kubectl apply -f my-todoapp.yaml
```

## What the Operator Creates

For each TodoApp resource, the operator automatically creates:

### Backend Resources
- **Deployment**: `{name}-backend` with configurable replicas
- **Service**: `{name}-backend-service` exposing port 5000
- **Resource Limits**: 256Mi/250m CPU requests, 512Mi/500m CPU limits

### Frontend Resources  
- **Deployment**: `{name}-frontend` with configurable replicas
- **Service**: `{name}-frontend-service` exposing port 80
- **Resource Limits**: 64Mi/100m CPU requests, 256Mi/250m CPU limits

## Monitoring and Management

```bash
# Check TodoApp resources
kubectl get todoapps

# View operator logs
kubectl logs -f deployment/todo-operator

# Check created resources
kubectl get deployments,services -l app=my-todo-app-backend
kubectl get deployments,services -l app=my-todo-app-frontend

# Scale your application by updating the TodoApp
kubectl patch todoapp my-todo-app --type='merge' -p='{"spec":{"backend":{"replicas":3}}}'
```

## Cleanup

To remove the operator and all its resources:

```bash
./cleanup.sh
```

## Development

### Building the Operator

```bash
go build -o todo-operator main.go
```

### Running Locally (Outside Cluster)

```bash
# Requires KUBECONFIG environment variable
./todo-operator -kubeconfig=$HOME/.kube/config
```

### Extending the Operator

The operator uses a simple reconciliation loop. To add new features:

1. Update the CRD in `todoapp_crd.yaml`
2. Modify the reconciliation logic in `main.go`
3. Add any required RBAC permissions in `rbac.yaml`

## Architecture

The operator follows the standard Kubernetes operator pattern:

1. **Watch**: Monitors TodoApp custom resources
2. **Reconcile**: Compares desired state (spec) with actual state
3. **Act**: Creates, updates, or deletes Kubernetes resources as needed
4. **Repeat**: Continuously loops every 30 seconds

## Production Considerations

- The operator runs with minimal required permissions via RBAC
- All deployments include resource requests and limits
- The operator handles creation, updates, and basic error recovery
- For advanced features like deletion handling, consider using the Operator SDK framework

---

This operator provides a foundation for managing Todo App deployments via Kubernetes custom resources. It demonstrates core operator patterns and can be extended for more complex scenarios.
