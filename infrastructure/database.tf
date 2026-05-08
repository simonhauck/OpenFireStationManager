provider "neon" {}

resource "neon_project" "open_fire_station_manager" {
  name       = "OpenFireStationmanager"
  pg_version = 18
  region_id  = "aws-eu-central-1"
  org_id     = "org-restless-king-43742972"
  # free accounts have maximum retention window of 6 hours (21600 seconds)
  history_retention_seconds = 21600
  # Configure default branch settings (optional)
  branch {
    name          = "production"
    database_name = "ofsm"
    role_name     = "ofsm_admin"
  }
}

resource "neon_branch" "develop" {
  project_id = neon_project.open_fire_station_manager.id
  name       = "develop"
  parent_id = neon_project.open_fire_station_manager.default_branch_id
}

resource "neon_endpoint" "develop_endpoint" {
  project_id = neon_project.open_fire_station_manager.id
  branch_id  = neon_branch.develop.id
}