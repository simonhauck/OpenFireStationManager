import { createFileRoute } from "@tanstack/react-router"

import ClothingTypesPage from "#/clothing/components/ClothingTypesPage"

export const Route = createFileRoute("/clothing-management/types/")({
  component: ClothingTypesRoute,
})

function ClothingTypesRoute() {
  return <ClothingTypesPage />
}
