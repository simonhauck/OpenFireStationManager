variable "stack_name" {
  description = "Name of the Portainer stack"
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

variable "remember_me_key" {
  description = "Secret key for remember-me cookie signing"
  type        = string
  sensitive   = true
}


