import { createFileRoute } from "@tanstack/react-router"

import EditClothingLocationPage from "#/clothing/components/locations/edit/EditClothingLocationPage"

export const Route = createFileRoute(
  "/clothing-management/locations/$clothingLocationId/edit",
)({
  component: EditClothingLocationRoute,
})

function EditClothingLocationRoute() {
  return <EditClothingLocationPage />
}
