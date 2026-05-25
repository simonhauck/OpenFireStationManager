terraform {

  cloud {

    organization = "SimonHauck"

    workspaces {
      name = "OpenFireStationManager"
    }
  }

  required_providers {
    neon = {
      source = "kislerdm/neon"
    }
    portainer = {
      source  = "portainer/portainer"
      version = "~> 1.29"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.0"
    }
  }
}

provider "portainer" {
  endpoint = "https://portainer.simonhauck.de"
  api_key  = var.arm_portainer_api_token
}



