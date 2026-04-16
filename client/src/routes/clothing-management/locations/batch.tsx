import { createFileRoute } from "@tanstack/react-router"

import LocationBatchImportPage from "#/clothing/components/locations/batch-import/LocationBatchImportPage"

export const Route = createFileRoute("/clothing-management/locations/batch")({
  component: LocationBatchImportRoute,
})

function LocationBatchImportRoute() {
  return <LocationBatchImportPage />
}
