import { createFileRoute } from "@tanstack/react-router"

import ClothingItemBatchImportPage from "#/clothing/components/ClothingItemBatchImportPage"

export const Route = createFileRoute("/klamottenmanagement/items/batch")({
  component: ClothingItemBatchImportRoute,
})

function ClothingItemBatchImportRoute() {
  return <ClothingItemBatchImportPage />
}
