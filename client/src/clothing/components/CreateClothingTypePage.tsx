import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"
import { useState } from "react"

import ClothingTypeForm from "#/clothing/components/ClothingTypeForm"
import { createClothingTypeMutation } from "#/clothing/service/clothingTypesQueries"
import RoleGuard from "#/components/base/RoleGuard"

export default function CreateClothingTypePage() {
  return (
    <RoleGuard allowedRoles={["KLEIDERWART"]}>
      <CreateClothingTypePageContent />
    </RoleGuard>
  )
}

function CreateClothingTypePageContent() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [name, setName] = useState("")

  const {
    mutate: createClothingType,
    isPending,
    error,
  } = useMutation(createClothingTypeMutation(queryClient))

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    createClothingType(
      { name },
      {
        onSuccess: () => {
          void navigate({ to: "/klamottenmanagement/types" })
        },
      },
    )
  }

  return (
    <ClothingTypeForm
      title="Kleidungstyp erstellen"
      description="Erfassen Sie die Daten fuer einen neuen Kleidungstyp."
      name={name}
      onNameChange={setName}
      onSubmit={handleSubmit}
      isPending={isPending}
      pendingLabel="Wird erstellt..."
      submitLabel="Kleidungstyp erstellen"
      errorMessage={
        error ? "Der Kleidungstyp konnte nicht erstellt werden." : null
      }
    />
  )
}
