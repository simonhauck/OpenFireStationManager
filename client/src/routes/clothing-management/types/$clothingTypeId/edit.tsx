import { createFileRoute } from "@tanstack/react-router"

import EditClothingTypePage from "#/clothing/components/EditClothingTypePage"

export const Route = createFileRoute(
  "/clothing-management/types/$clothingTypeId/edit",
)({
  component: EditClothingTypeRoute,
})

function EditClothingTypeRoute() {
  return <EditClothingTypePage />
}
