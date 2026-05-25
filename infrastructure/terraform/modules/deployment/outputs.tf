output "webhook_url" {
  description = "Webhook URL to trigger a stack redeployment on push"
  value       = portainer_stack.this.webhook_url
  sensitive   = true
}

output "port" {
  description = "Host port the stack is exposed on"
  value       = var.port
}
