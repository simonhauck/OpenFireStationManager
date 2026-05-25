locals {
  portainer_endpoint_id = 1
}

resource "random_password" "remember_me_key" {
  length = 64
}

module "ofsm_dev" {
  source = "./modules/deployment"

  deployment_name   = "develop"
  endpoint_id       = local.portainer_endpoint_id
  compose_file_path = "infrastructure/ofsm-dev/compose.yml"
  git_branch        = "main"
  port              = 13433

  db_url          = local.db_urls.develop.pooler
  remember_me_key = random_password.remember_me_key.result
}

module "ofsm_prod" {
  source = "./modules/deployment"

  deployment_name   = "production"
  endpoint_id       = local.portainer_endpoint_id
  compose_file_path = "infrastructure/ofsm-prod/compose.yml"
  git_branch        = "main"
  port              = 13455

  db_url          = local.db_urls.production.pooler
  remember_me_key = random_password.remember_me_key.result
}
