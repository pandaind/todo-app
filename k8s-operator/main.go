package main

import (
	"context"
	"flag"
	"fmt"
	"os"
	"time"

	appsv1 "k8s.io/api/apps/v1"
	corev1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/apimachinery/pkg/util/intstr"
	"k8s.io/client-go/dynamic"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/rest"
)

func reconcileBackend(clientset kubernetes.Interface, name, namespace, image string, replicas int32) error {
	deploymentName := name + "-backend"
	serviceName := name + "-backend-service"

	// Create or update Deployment
	deployment := &appsv1.Deployment{
		ObjectMeta: metav1.ObjectMeta{
			Name:      deploymentName,
			Namespace: namespace,
		},
		Spec: appsv1.DeploymentSpec{
			Replicas: &replicas,
			Selector: &metav1.LabelSelector{
				MatchLabels: map[string]string{
					"app": deploymentName,
				},
			},
			Template: corev1.PodTemplateSpec{
				ObjectMeta: metav1.ObjectMeta{
					Labels: map[string]string{
						"app": deploymentName,
					},
				},
				Spec: corev1.PodSpec{
					Containers: []corev1.Container{
						{
							Name:  "backend",
							Image: image,
							Ports: []corev1.ContainerPort{
								{
									ContainerPort: 5000,
								},
							},
							Resources: corev1.ResourceRequirements{
								Requests: corev1.ResourceList{
									corev1.ResourceMemory: "256Mi",
									corev1.ResourceCPU:    "250m",
								},
								Limits: corev1.ResourceList{
									corev1.ResourceMemory: "512Mi",
									corev1.ResourceCPU:    "500m",
								},
							},
						},
					},
				},
			},
		},
	}

	_, err := clientset.AppsV1().Deployments(namespace).Get(context.TODO(), deploymentName, metav1.GetOptions{})
	if errors.IsNotFound(err) {
		_, err = clientset.AppsV1().Deployments(namespace).Create(context.TODO(), deployment, metav1.CreateOptions{})
		fmt.Printf("Created backend deployment: %s\n", deploymentName)
	} else if err == nil {
		_, err = clientset.AppsV1().Deployments(namespace).Update(context.TODO(), deployment, metav1.UpdateOptions{})
		fmt.Printf("Updated backend deployment: %s\n", deploymentName)
	}
	if err != nil {
		return err
	}

	// Create or update Service
	service := &corev1.Service{
		ObjectMeta: metav1.ObjectMeta{
			Name:      serviceName,
			Namespace: namespace,
		},
		Spec: corev1.ServiceSpec{
			Selector: map[string]string{
				"app": deploymentName,
			},
			Ports: []corev1.ServicePort{
				{
					Protocol:   corev1.ProtocolTCP,
					Port:       5000,
					TargetPort: intstr.FromInt(5000),
				},
			},
		},
	}

	_, err = clientset.CoreV1().Services(namespace).Get(context.TODO(), serviceName, metav1.GetOptions{})
	if errors.IsNotFound(err) {
		_, err = clientset.CoreV1().Services(namespace).Create(context.TODO(), service, metav1.CreateOptions{})
		fmt.Printf("Created backend service: %s\n", serviceName)
	} else if err == nil {
		_, err = clientset.CoreV1().Services(namespace).Update(context.TODO(), service, metav1.UpdateOptions{})
		fmt.Printf("Updated backend service: %s\n", serviceName)
	}
	return err
}

func reconcileFrontend(clientset kubernetes.Interface, name, namespace, image string, replicas int32) error {
	deploymentName := name + "-frontend"
	serviceName := name + "-frontend-service"

	// Create or update Deployment
	deployment := &appsv1.Deployment{
		ObjectMeta: metav1.ObjectMeta{
			Name:      deploymentName,
			Namespace: namespace,
		},
		Spec: appsv1.DeploymentSpec{
			Replicas: &replicas,
			Selector: &metav1.LabelSelector{
				MatchLabels: map[string]string{
					"app": deploymentName,
				},
			},
			Template: corev1.PodTemplateSpec{
				ObjectMeta: metav1.ObjectMeta{
					Labels: map[string]string{
						"app": deploymentName,
					},
				},
				Spec: corev1.PodSpec{
					Containers: []corev1.Container{
						{
							Name:  "frontend",
							Image: image,
							Ports: []corev1.ContainerPort{
								{
									ContainerPort: 80,
								},
							},
							Resources: corev1.ResourceRequirements{
								Requests: corev1.ResourceList{
									corev1.ResourceMemory: "64Mi",
									corev1.ResourceCPU:    "100m",
								},
								Limits: corev1.ResourceList{
									corev1.ResourceMemory: "256Mi",
									corev1.ResourceCPU:    "250m",
								},
							},
						},
					},
				},
			},
		},
	}

	_, err := clientset.AppsV1().Deployments(namespace).Get(context.TODO(), deploymentName, metav1.GetOptions{})
	if errors.IsNotFound(err) {
		_, err = clientset.AppsV1().Deployments(namespace).Create(context.TODO(), deployment, metav1.CreateOptions{})
		fmt.Printf("Created frontend deployment: %s\n", deploymentName)
	} else if err == nil {
		_, err = clientset.AppsV1().Deployments(namespace).Update(context.TODO(), deployment, metav1.UpdateOptions{})
		fmt.Printf("Updated frontend deployment: %s\n", deploymentName)
	}
	if err != nil {
		return err
	}

	// Create or update Service
	service := &corev1.Service{
		ObjectMeta: metav1.ObjectMeta{
			Name:      serviceName,
			Namespace: namespace,
		},
		Spec: corev1.ServiceSpec{
			Selector: map[string]string{
				"app": deploymentName,
			},
			Ports: []corev1.ServicePort{
				{
					Protocol:   corev1.ProtocolTCP,
					Port:       80,
					TargetPort: intstr.FromInt(80),
				},
			},
		},
	}

	_, err = clientset.CoreV1().Services(namespace).Get(context.TODO(), serviceName, metav1.GetOptions{})
	if errors.IsNotFound(err) {
		_, err = clientset.CoreV1().Services(namespace).Create(context.TODO(), service, metav1.CreateOptions{})
		fmt.Printf("Created frontend service: %s\n", serviceName)
	} else if err == nil {
		_, err = clientset.CoreV1().Services(namespace).Update(context.TODO(), service, metav1.UpdateOptions{})
		fmt.Printf("Updated frontend service: %s\n", serviceName)
	}
	return err
}

func main() {
	kubeconfig := flag.String("kubeconfig", "", "absolute path to the kubeconfig file")
	flag.Parse()

	config, err := rest.InClusterConfig()
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error creating k8s config: %v\n", err)
		os.Exit(1)
	}

	dynClient, err := dynamic.NewForConfig(config)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error creating dynamic client: %v\n", err)
		os.Exit(1)
	}

	clientset, err := kubernetes.NewForConfig(config)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error creating clientset: %v\n", err)
		os.Exit(1)
	}

	gvr := schema.GroupVersionResource{
		Group:    "todoapp.github.com",
		Version:  "v1alpha1",
		Resource: "todoapps",
	}

	for {
		list, err := dynClient.Resource(gvr).Namespace("default").List(context.TODO(), metav1.ListOptions{})
		if err != nil {
			fmt.Fprintf(os.Stderr, "Error listing TodoApps: %v\n", err)
		} else {
			fmt.Printf("Found %d TodoApp resources\n", len(list.Items))
			for _, item := range list.Items {
				name := item.GetName()
				namespace := item.GetNamespace()
				if namespace == "" {
					namespace = "default"
				}
				spec, found, err := unstructured.NestedMap(item.Object, "spec")
				if err != nil || !found {
					fmt.Fprintf(os.Stderr, "Error reading spec for %s: %v\n", name, err)
					continue
				}
				
				// Reconcile backend
				if backend, ok := spec["backend"].(map[string]interface{}); ok {
					image, _ := backend["image"].(string)
					replicas := int32(2) // default
					if r, ok := backend["replicas"].(float64); ok {
						replicas = int32(r)
					}
					fmt.Printf("Reconciling backend for %s: image=%s replicas=%d\n", name, image, replicas)
					
					if err := reconcileBackend(clientset, name, namespace, image, replicas); err != nil {
						fmt.Fprintf(os.Stderr, "Error reconciling backend for %s: %v\n", name, err)
					}
				}
				
				// Reconcile frontend
				if frontend, ok := spec["frontend"].(map[string]interface{}); ok {
					image, _ := frontend["image"].(string)
					replicas := int32(2) // default
					if r, ok := frontend["replicas"].(float64); ok {
						replicas = int32(r)
					}
					fmt.Printf("Reconciling frontend for %s: image=%s replicas=%d\n", name, image, replicas)
					
					if err := reconcileFrontend(clientset, name, namespace, image, replicas); err != nil {
						fmt.Fprintf(os.Stderr, "Error reconciling frontend for %s: %v\n", name, err)
					}
				}
			}
		}
		time.Sleep(30 * time.Second)
	}
}
