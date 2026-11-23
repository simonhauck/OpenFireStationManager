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
    name  = "OIDC_ISSUER_URI"
    value = var.oidc_issuer_uri
  }

  env {
    name  = "OIDC_CLIENT_ID"
    value = var.oidc_client_id
  }

  env {
    name  = "OIDC_CLIENT_SECRET"
    value = var.oidc_client_secret
  }

  env {
    name  = "OIDC_ROLES_CLAIM_PATH"
    value = var.oidc_roles_claim_path
  }

  env {
    name  = "OIDC_ROLE_ADMIN"
    value = var.oidc_role_admin
  }

  env {
    name  = "OIDC_ROLE_KLEIDERWART"
    value = var.oidc_role_kleiderwart
  }

  env {
    name  = "OIDC_ROLE_USER"
    value = var.oidc_role_user
  }
}
