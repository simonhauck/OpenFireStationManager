import { createFileRoute } from "@tanstack/react-router"

import CreateClothingItemPage from "#/clothing/components/CreateClothingItemPage"

export const Route = createFileRoute("/clothing-management/items/new")({
  component: CreateClothingItemRoute,
})

function CreateClothingItemRoute() {
  return <CreateClothingItemPage />
}
