import { createFileRoute } from "@tanstack/react-router"

import ClothingItemBatchImportPage from "#/clothing/components/items/batch-import/ClothingItemBatchImportPage"

export const Route = createFileRoute("/clothing-management/items/batch")({
  component: ClothingItemBatchImportRoute,
})

function ClothingItemBatchImportRoute() {
  return <ClothingItemBatchImportPage />
}
