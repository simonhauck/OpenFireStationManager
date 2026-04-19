import ClothingLocationForm from "#/clothing/components/shared/ClothingLocationForm"
import RoleGuard from "#/components/base/RoleGuard"

export default function CreateClothingLocationPage() {
  return (
    <RoleGuard allowedRoles={["KLEIDERWART"]}>
      <ClothingLocationForm />
    </RoleGuard>
  )
}
