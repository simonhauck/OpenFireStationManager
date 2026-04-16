import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"
import { useState } from "react"

import ClothingLocationForm from "#/clothing/components/shared/ClothingLocationForm"
import { createClothingLocationMutation } from "#/clothing/service/clothingLocationsQueries"
import RoleGuard from "#/components/base/RoleGuard"

export default function CreateClothingLocationPage() {
  return (
    <RoleGuard allowedRoles={["KLEIDERWART"]}>
      <CreateClothingLocationPageContent />
    </RoleGuard>
  )
}

function CreateClothingLocationPageContent() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [name, setName] = useState("")
  const [comment, setComment] = useState("")
  const [onlyVisibleForKleiderwart, setOnlyVisibleForKleiderwart] =
    useState(false)
  const [shouldBeShownOnDashboard, setShouldBeShownOnDashboard] =
    useState(false)

  const {
    mutate: createLocation,
    isPending,
    error,
  } = useMutation(createClothingLocationMutation(queryClient))

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    createLocation(
      { name, comment, onlyVisibleForKleiderwart, shouldBeShownOnDashboard },
      {
        onSuccess: () => {
          void navigate({ to: "/clothing-management/locations" })
        },
      },
    )
  }

  return (
    <ClothingLocationForm
      title="Standort erstellen"
      description="Erfassen Sie die Daten fuer einen neuen Standort."
      name={name}
      onNameChange={setName}
      comment={comment}
      onCommentChange={setComment}
      onlyVisibleForKleiderwart={onlyVisibleForKleiderwart}
      onOnlyVisibleForKleiderwartChange={setOnlyVisibleForKleiderwart}
      shouldBeShownOnDashboard={shouldBeShownOnDashboard}
      onShouldBeShownOnDashboardChange={setShouldBeShownOnDashboard}
      onSubmit={handleSubmit}
      isPending={isPending}
      pendingLabel="Wird erstellt..."
      submitLabel="Standort erstellen"
      errorMessage={error ? "Der Standort konnte nicht erstellt werden." : null}
    />
  )
}
