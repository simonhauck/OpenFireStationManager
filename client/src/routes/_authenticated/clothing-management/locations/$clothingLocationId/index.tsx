import { createFileRoute } from "@tanstack/react-router"

import LocationDetailPage from "#/clothing/components/locations/detail/LocationDetailPage"

export const Route = createFileRoute(
  "/_authenticated/clothing-management/locations/$clothingLocationId/",
)({
  component: LocationDetailRoute,
})

function LocationDetailRoute() {
  return <LocationDetailPage />
}
