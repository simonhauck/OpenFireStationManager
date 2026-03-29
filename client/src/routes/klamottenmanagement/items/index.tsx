import { createFileRoute } from "@tanstack/react-router"

import ClothingItemsPage from "#/clothing/components/ClothingItemsPage"

export const Route = createFileRoute("/klamottenmanagement/items/")({
  component: RouteComponent,
})

function RouteComponent() {
  return <ClothingItemsPage />
}
