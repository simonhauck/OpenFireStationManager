import { useParams } from "@tanstack/react-router"

import ClothingLocationForm from "#/clothing/components/shared/ClothingLocationForm"
import { useClothingLocationById } from "#/clothing/service/clothingLocationsQueries"
import ErrorState from "#/components/base/ErrorState"
import LoadingIndicator from "#/components/base/LoadingIndicator"
import RoleGuard from "#/components/base/RoleGuard"

export default function EditClothingLocationPage() {
  return (
    <RoleGuard allowedRoles={["KLEIDERWART"]}>
      <EditClothingLocationPageContent />
    </RoleGuard>
  )
}

function EditClothingLocationPageContent() {
  const { clothingLocationId } = useParams({
    from: "/clothing-management/locations/$clothingLocationId/edit",
  })
  const numericLocationId = Number(clothingLocationId)

  const {
    data: location,
    isLoading,
    isError,
  } = useClothingLocationById(numericLocationId)

  if (!Number.isFinite(numericLocationId)) {
    return <ErrorState message="Ungueltige Standort-ID." />
  }

  if (isLoading) {
    return <LoadingIndicator label="Standort wird geladen..." />
  }

  if (isError || !location) {
    return <ErrorState message="Standort konnte nicht geladen werden." />
  }

  return <ClothingLocationForm existingLocation={location} />
}
