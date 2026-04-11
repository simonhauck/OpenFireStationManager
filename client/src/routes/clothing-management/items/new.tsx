import { createFileRoute } from "@tanstack/react-router"

import RoleGuard from "#/components/base/RoleGuard"
import ClothingItemForm from "#/clothing/components/ClothingItemForm.tsx"

export const Route = createFileRoute("/clothing-management/items/new")({
  component: CreateClothingItemRoute,
})

function CreateClothingItemRoute() {
  return (
    <RoleGuard allowedRoles={["KLEIDERWART"]}>
      <ClothingItemForm existingItem={undefined} />
    </RoleGuard>
  )
}
