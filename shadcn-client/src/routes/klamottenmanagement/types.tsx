import { createFileRoute } from "@tanstack/react-router"

import ClothingTypesPage from "#/clothing/components/ClothingTypesPage"

export const Route = createFileRoute("/klamottenmanagement/types")({
  component: ClothingTypesRoute,
})

function ClothingTypesRoute() {
  return <ClothingTypesPage />
}
