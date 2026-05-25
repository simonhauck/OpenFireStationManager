locals {
  repository_url = "https://github.com/simonhauck/OpenFireStationManager"
  stack_name     = "ofsm-${var.deployment_name}"
}

resource "portainer_stack" "this" {
  name            = local.stack_name
  deployment_type = "standalone"
  method          = "repository"
  endpoint_id     = var.endpoint_id

  repository_url            = local.repository_url
  repository_reference_name = "refs/heads/${var.git_branch}"
  file_path_in_repository   = var.compose_file_path

  stack_webhook = true
  pull_image    = true

  env {
    name  = "APP_PORT"
    value = var.port
  }

  env {
    name  = "DB_URL"
    value = var.db_url
  }

  env {
    name  = "REMEMBER_ME_KEY"
    value = var.remember_me_key
  }
}
