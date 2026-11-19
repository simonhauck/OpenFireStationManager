variable "deployment_name" {
  description = "Deployment name (e.g. 'dev', 'prod'). Stack will be named 'ofsm-{deployment_name}'"
  type        = string
}

variable "endpoint_id" {
  description = "Portainer environment (endpoint) ID to deploy into"
  type        = number
}

variable "compose_file_path" {
  description = "Path to the compose file within the repository"
  type        = string
}

variable "git_branch" {
  description = "Git branch to track"
  type        = string
}

variable "port" {
  description = "Host port the stack exposes (injected as APP_PORT into the compose file)"
  type        = number
}

variable "db_url" {
  description = "JDBC database connection string"
  type        = string
  sensitive   = true
}

variable "oidc_issuer_uri" {
  description = "OpenID Connect issuer URI, e.g. https://keycloak.example.org/realms/ofsm. The app does not start while it is unreachable"
  type        = string
}

variable "oidc_client_id" {
  description = "OpenID Connect client ID registered for this deployment"
  type        = string
}

variable "oidc_client_secret" {
  description = "OpenID Connect client secret of the confidential client"
  type        = string
  sensitive   = true
}

variable "oidc_roles_claim_path" {
  description = "Dot-separated claim path that carries the provider roles"
  type        = string
  default     = "realm_access.roles"
}

variable "oidc_role_admin" {
  description = "Provider role that grants the OFSM role ADMIN"
  type        = string
  default     = "ofsm-admin"
}

variable "oidc_role_kleiderwart" {
  description = "Provider role that grants the OFSM role KLEIDERWART"
  type        = string
  default     = "ofsm-kleiderwart"
}

variable "oidc_role_user" {
  description = "Provider role that grants the OFSM role USER"
  type        = string
  default     = "ofsm-user"
}
