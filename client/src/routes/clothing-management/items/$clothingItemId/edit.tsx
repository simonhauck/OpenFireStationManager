import { createFileRoute } from "@tanstack/react-router"

import EditClothingItemPage from "#/clothing/components/EditClothingItemPage"
import RoleGuard from "#/components/base/RoleGuard"

export const Route = createFileRoute(
  "/clothing-management/items/$clothingItemId/edit",
)({
  component: EditClothingItemRoute,
})

function EditClothingItemRoute() {
  return (
    <RoleGuard allowedRoles={["KLEIDERWART"]}>
      <EditClothingItemPage />
    </RoleGuard>
  )
}
