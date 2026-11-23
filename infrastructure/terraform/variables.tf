variable "arm_portainer_api_token" {
  description = "Portainer API token"
  type        = string
  sensitive   = true
}

variable "ofsm_github_token" {
  description = "GitHub Personal Access Token with repo scope for writing environment secrets"
  type        = string
  sensitive   = true
}


variable "oidc_dev" {
  description = "OpenID Connect client of the develop deployment (issuer URI, client ID and secret)"
  type = object({
    issuer_uri    = string
    client_id     = string
    client_secret = string
  })
  sensitive = true
}

variable "oidc_prod" {
  description = "OpenID Connect client of the production deployment (issuer URI, client ID and secret)"
  type = object({
    issuer_uri    = string
    client_id     = string
    client_secret = string
  })
  sensitive = true
}
