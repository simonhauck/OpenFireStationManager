locals {
  repository_url = "https://github.com/simonhauck/OpenFireStationManager"
}

resource "portainer_stack" "this" {
  name            = var.stack_name
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
