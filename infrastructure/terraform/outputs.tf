output "app_ports" {
  description = "Host ports for each deployed stack"
  value = {
    dev  = module.ofsm_dev.port
    prod = module.ofsm_prod.port
  }
}

output "webhook_urls" {
  description = "Webhook URLs to trigger redeployment for each stack (use in GitHub Actions)"
  sensitive   = true
  value = {
    dev  = module.ofsm_dev.webhook_url
    prod = module.ofsm_prod.webhook_url
  }
}
