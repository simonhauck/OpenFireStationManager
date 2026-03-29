import { createFileRoute } from "@tanstack/react-router"

import EditClothingTypePage from "#/clothing/components/EditClothingTypePage"

export const Route = createFileRoute(
  "/klamottenmanagement/types/$clothingTypeId/edit",
)({
  component: EditClothingTypeRoute,
})

function EditClothingTypeRoute() {
  return <EditClothingTypePage />
}
