import { createFileRoute } from "@tanstack/react-router"

import CreateClothingTypePage from "#/clothing/components/CreateClothingTypePage"

export const Route = createFileRoute("/klamottenmanagement/types/new")({
  component: CreateClothingTypeRoute,
})

function CreateClothingTypeRoute() {
  return <CreateClothingTypePage />
}
