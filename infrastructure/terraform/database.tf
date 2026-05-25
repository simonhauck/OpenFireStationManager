provider "neon" {
}

resource "neon_project" "open_fire_station_manager" {
  name       = "OpenFireStationmanager"
  pg_version = 18
  region_id  = "aws-eu-central-1"
  org_id     = "org-restless-king-43742972"
  # free accounts have maximum retention window of 6 hours (21600 seconds)
  history_retention_seconds = 21600

  branch {
    name          = "production"
    database_name = "ofsm"
    role_name     = "postgres"
  }

  lifecycle {
    prevent_destroy = true
  }
}

resource "neon_branch" "develop" {
  project_id = neon_project.open_fire_station_manager.id
  name       = "develop"
  parent_id  = neon_project.open_fire_station_manager.default_branch_id
}

resource "neon_endpoint" "develop_endpoint" {
  project_id = neon_project.open_fire_station_manager.id
  branch_id  = neon_branch.develop.id
}

resource "neon_branch" "local" {
  project_id = neon_project.open_fire_station_manager.id
  name       = "local"
  parent_id  = neon_project.open_fire_station_manager.default_branch_id
}

resource "neon_endpoint" "local_endpoint" {
  project_id = neon_project.open_fire_station_manager.id
  branch_id  = neon_branch.local.id
}

// ---------------------------------------------------------------------------------------------------------------------
// Outputs
// ---------------------------------------------------------------------------------------------------------------------

locals {
  db_user     = neon_project.open_fire_station_manager.database_user
  db_password = neon_project.open_fire_station_manager.database_password
  db_name     = neon_project.open_fire_station_manager.database_name

  # Builds a map of { direct, pooler } JDBC URLs given two hostnames
  db_urls = {
    production = {
      direct = neon_project.open_fire_station_manager.database_host
      pooler = neon_project.open_fire_station_manager.database_host_pooler
    }
    develop = {
      direct = neon_endpoint.develop_endpoint.host
      pooler = "${neon_endpoint.develop_endpoint.id}-pooler.${neon_endpoint.develop_endpoint.proxy_host}"
    }
    local = {
      direct = neon_endpoint.local_endpoint.host
      pooler = "${neon_endpoint.local_endpoint.id}-pooler.${neon_endpoint.local_endpoint.proxy_host}"
    }
  }

  jdbc_urls = {
    for branch, hosts in local.db_urls : branch => {
      for type, host in hosts : type =>
      "jdbc:postgresql://${host}/${local.db_name}?user=${local.db_user}&password=${local.db_password}&sslmode=require&channelBinding=require"
    }
  }
}

output "db_urls" {
  description = "JDBC connection strings for all branches and connection types (direct / pooler)"
  sensitive   = true
  value       = local.jdbc_urls
}
