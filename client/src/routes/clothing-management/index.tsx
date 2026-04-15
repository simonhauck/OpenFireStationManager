import { createFileRoute } from "@tanstack/react-router"

import ClothingManagementOverviewPage from "#/clothing/components/overview/ClothingManagementOverviewPage"

export const Route = createFileRoute("/clothing-management/")({
  component: ClothingManagementIndexRoute,
})

function ClothingManagementIndexRoute() {
  return <ClothingManagementOverviewPage />
}
