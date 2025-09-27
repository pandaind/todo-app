output "application_url" {
  description = "Application URL for UAT environment"
  value       = module.todo_app.application_url
}

output "alb_dns_name" {
  description = "ALB DNS name"
  value       = module.todo_app.alb_dns_name
}

output "ecs_cluster_name" {
  description = "ECS cluster name"
  value       = module.todo_app.ecs_cluster_name
}
