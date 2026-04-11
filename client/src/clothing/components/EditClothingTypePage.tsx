import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useNavigate, useParams } from "@tanstack/react-router"
import { useEffect, useState } from "react"

import ClothingTypeForm from "#/clothing/components/ClothingTypeForm"
import {
  updateClothingTypeMutation,
  useClothingTypeById,
} from "#/clothing/service/clothingTypesQueries"
import ErrorState from "#/components/base/ErrorState"
import LoadingIndicator from "#/components/base/LoadingIndicator"
import RoleGuard from "#/components/base/RoleGuard"

export default function EditClothingTypePage() {
  return (
    <RoleGuard allowedRoles={["KLEIDERWART"]}>
      <EditClothingTypePageContent />
    </RoleGuard>
  )
}

function EditClothingTypePageContent() {
  const { clothingTypeId } = useParams({
    from: "/clothing-management/types/$clothingTypeId/edit",
  })
  const numericClothingTypeId = Number(clothingTypeId)

  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [name, setName] = useState("")

  const {
    data: clothingType,
    isLoading,
    isError,
  } = useClothingTypeById(numericClothingTypeId)

  const {
    mutate: updateClothingType,
    isPending,
    error,
  } = useMutation(updateClothingTypeMutation(queryClient))

  useEffect(() => {
    if (!clothingType) {
      return
    }

    setName(clothingType.name)
  }, [clothingType])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    updateClothingType(
      {
        id: numericClothingTypeId,
        body: { name },
      },
      {
        onSuccess: () => {
          void navigate({ to: "/clothing-management/types" })
        },
      },
    )
  }

  if (!Number.isFinite(numericClothingTypeId)) {
    return <ErrorState message="Ungueltige Kleidungstyp-ID." />
  }

  if (isLoading) {
    return <LoadingIndicator label="Kleidungstyp wird geladen..." />
  }

  if (isError || !clothingType) {
    return <ErrorState message="Kleidungstyp konnte nicht geladen werden." />
  }

  return (
    <ClothingTypeForm
      title="Kleidungstyp bearbeiten"
      description="Bearbeiten Sie die Bezeichnung des Kleidungstyps."
      name={name}
      onNameChange={setName}
      onSubmit={handleSubmit}
      isPending={isPending}
      pendingLabel="Wird gespeichert..."
      submitLabel="Aenderungen speichern"
      errorMessage={
        error ? "Der Kleidungstyp konnte nicht aktualisiert werden." : null
      }
    />
  )
}
