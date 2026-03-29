import { createFileRoute } from "@tanstack/react-router"

import ClothingItemsPage from "#/clothing/components/ClothingItemsPage"

export const Route = createFileRoute("/klamottenmanagement/items/")({
  component: ClothingItemsRoute,
})

function ClothingItemsRoute() {
  return <ClothingItemsPage />
}
