import { createFileRoute } from "@tanstack/react-router"
import ClothingItemForm from "#/clothing/components/shared/ClothingItemForm.tsx"
import RoleGuard from "#/components/base/RoleGuard"

export const Route = createFileRoute(
  "/_authenticated/clothing-management/items/new",
)({
  component: CreateClothingItemRoute,
})

function CreateClothingItemRoute() {
  return (
    <RoleGuard allowedRoles={["KLEIDERWART"]}>
      <ClothingItemForm existingItem={undefined} />
    </RoleGuard>
  )
}
