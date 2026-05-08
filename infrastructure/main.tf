terraform {

  cloud {

    organization = "SimonHauck"

    workspaces {
      name = "OpenFireStationManager"
    }
  }

  required_providers {
    neon = {
      source  = "kislerdm/neon"
    }
  }
}
