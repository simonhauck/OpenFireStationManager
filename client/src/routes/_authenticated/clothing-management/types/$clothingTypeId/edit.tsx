import { createFileRoute } from "@tanstack/react-router"

import EditClothingTypePage from "#/clothing/components/types/edit/EditClothingTypePage"

export const Route = createFileRoute(
  "/_authenticated/clothing-management/types/$clothingTypeId/edit",
)({
  component: EditClothingTypeRoute,
})

function EditClothingTypeRoute() {
  return <EditClothingTypePage />
}
