import { createFileRoute } from "@tanstack/react-router"

import CreateClothingItemPage from "#/clothing/components/CreateClothingItemPage"
import RoleGuard from "#/components/base/RoleGuard"

export const Route = createFileRoute("/clothing-management/items/new")({
  component: CreateClothingItemRoute,
})

function CreateClothingItemRoute() {
  return (
    <RoleGuard allowedRoles={["KLEIDERWART"]}>
      <CreateClothingItemPage />
    </RoleGuard>
  )
}
