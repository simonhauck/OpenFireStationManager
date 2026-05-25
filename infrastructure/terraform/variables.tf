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

