import { createFileRoute } from "@tanstack/react-router"

import EditClothingItemPage from "#/clothing/components/EditClothingItemPage"

export const Route = createFileRoute(
  "/clothing-management/items/$clothingItemId/edit",
)({
  component: EditClothingItemRoute,
})

function EditClothingItemRoute() {
  return <EditClothingItemPage />
}
