locals {
  github_repository          = "OpenFireStationManager"
  deploy_webhook_secret_name = "DEPLOY_WEBHOOK_URL"
}

resource "github_repository_environment" "develop" {
  repository  = local.github_repository
  environment = "develop"
}

resource "github_repository_environment" "production" {
  repository  = local.github_repository
  environment = "production"
}

resource "github_actions_environment_secret" "deploy_webhook_url_develop" {
  repository  = local.github_repository
  environment = github_repository_environment.develop.environment
  secret_name = local.deploy_webhook_secret_name
  value       = module.ofsm_dev.webhook_url
}

resource "github_actions_environment_secret" "deploy_webhook_url_production" {
  repository  = local.github_repository
  environment = github_repository_environment.production.environment
  secret_name = local.deploy_webhook_secret_name
  value       = module.ofsm_prod.webhook_url
}
