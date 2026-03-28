import { createFileRoute } from "@tanstack/react-router"

import ClothingManagementOverviewPage from "#/clothing/components/ClothingManagementOverviewPage"

export const Route = createFileRoute("/klamottenmanagement/")({
  component: KlamottenManagementIndexRoute,
})

function KlamottenManagementIndexRoute() {
  return <ClothingManagementOverviewPage />
}
