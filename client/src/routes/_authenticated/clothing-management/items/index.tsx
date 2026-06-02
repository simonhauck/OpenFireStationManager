import { createFileRoute } from "@tanstack/react-router"

import ClothingItemsPage from "#/clothing/components/items/list/ClothingItemsPage"

export const Route = createFileRoute("/_authenticated/clothing-management/items/")({
  component: ClothingItemsRoute,
})

function ClothingItemsRoute() {
  return <ClothingItemsPage />
}
