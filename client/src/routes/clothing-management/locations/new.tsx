import { createFileRoute } from "@tanstack/react-router"

import CreateClothingLocationPage from "#/clothing/components/locations/create/CreateClothingLocationPage"

export const Route = createFileRoute("/clothing-management/locations/new")({
  component: CreateClothingLocationRoute,
})

function CreateClothingLocationRoute() {
  return <CreateClothingLocationPage />
}
