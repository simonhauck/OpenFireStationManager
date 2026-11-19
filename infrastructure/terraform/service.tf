locals {
  portainer_endpoint_id = 1
}

module "ofsm_dev" {
  source = "./modules/deployment"

  deployment_name   = "develop"
  endpoint_id       = local.portainer_endpoint_id
  compose_file_path = "infrastructure/ofsm-dev/compose.yml"
  git_branch        = "main"
  port              = 13433

  db_url             = local.db_urls.develop.pooler
  oidc_issuer_uri    = var.oidc_dev.issuer_uri
  oidc_client_id     = var.oidc_dev.client_id
  oidc_client_secret = var.oidc_dev.client_secret
}

module "ofsm_prod" {
  source = "./modules/deployment"

  deployment_name   = "production"
  endpoint_id       = local.portainer_endpoint_id
  compose_file_path = "infrastructure/ofsm-prod/compose.yml"
  git_branch        = "main"
  port              = 13455

  db_url             = local.db_urls.production.pooler
  oidc_issuer_uri    = var.oidc_prod.issuer_uri
  oidc_client_id     = var.oidc_prod.client_id
  oidc_client_secret = var.oidc_prod.client_secret
}
