import { useToast } from "@astryxdesign/core/Toast"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"
import { useState } from "react"

import ClothingTypeForm from "#/clothing/components/shared/ClothingTypeForm"
import PendingClothingTypeImages from "#/clothing/components/shared/PendingClothingTypeImages"
import { uploadClothingTypeImageMutation } from "#/clothing/service/clothingTypeImagesQueries"
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
  const showToast = useToast()
  const [name, setName] = useState("")
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])

  const {
    mutate: createClothingType,
    isPending: isCreating,
    error,
  } = useMutation(createClothingTypeMutation(queryClient))
  const { mutateAsync: uploadImage, isPending: isUploading } = useMutation(
    uploadClothingTypeImageMutation(queryClient),
  )

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    createClothingType(
      { name },
      {
        onSuccess: async (created) => {
          let uploadFailed = false
          for (const file of selectedFiles) {
            try {
              await uploadImage({ typeId: created.id, file })
            } catch {
              uploadFailed = true
              break
            }
          }

          if (uploadFailed) {
            showToast({
              body: "Der Kleidungstyp wurde erstellt, aber nicht alle Bilder konnten hochgeladen werden.",
              type: "error",
            })
            void navigate({
              to: "/clothing-management/types/$clothingTypeId/edit",
              params: { clothingTypeId: String(created.id) },
            })
            return
          }

          void navigate({ to: "/clothing-management/types" })
        },
      },
    )
  }

  return (
    <ClothingTypeForm
      title="Kleidungstyp erstellen"
      description="Erfassen Sie die Daten für einen neuen Kleidungstyp."
      name={name}
      onNameChange={setName}
      onSubmit={handleSubmit}
      isPending={isCreating || isUploading}
      pendingLabel="Wird erstellt..."
      submitLabel="Kleidungstyp erstellen"
      errorMessage={
        error ? "Der Kleidungstyp konnte nicht erstellt werden." : null
      }
      images={
        <PendingClothingTypeImages
          files={selectedFiles}
          onChange={setSelectedFiles}
        />
      }
    />
  )
}
