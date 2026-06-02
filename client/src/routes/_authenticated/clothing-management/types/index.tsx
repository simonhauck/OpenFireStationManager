import { createFileRoute } from "@tanstack/react-router"

import ClothingTypesPage from "#/clothing/components/types/list/ClothingTypesPage"

export const Route = createFileRoute(
  "/_authenticated/clothing-management/types/",
)({
  component: ClothingTypesRoute,
})

function ClothingTypesRoute() {
  return <ClothingTypesPage />
}
