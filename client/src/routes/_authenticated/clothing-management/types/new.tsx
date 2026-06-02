import { createFileRoute } from "@tanstack/react-router"

import CreateClothingTypePage from "#/clothing/components/types/create/CreateClothingTypePage"

export const Route = createFileRoute("/_authenticated/clothing-management/types/new")({
  component: CreateClothingTypeRoute,
})

function CreateClothingTypeRoute() {
  return <CreateClothingTypePage />
}
