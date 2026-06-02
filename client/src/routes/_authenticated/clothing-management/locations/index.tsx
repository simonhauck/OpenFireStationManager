import { createFileRoute } from "@tanstack/react-router"

import ClothingLocationsPage from "#/clothing/components/locations/list/ClothingLocationsPage"

export const Route = createFileRoute(
  "/_authenticated/clothing-management/locations/",
)({
  component: ClothingLocationsRoute,
})

function ClothingLocationsRoute() {
  return <ClothingLocationsPage />
}
