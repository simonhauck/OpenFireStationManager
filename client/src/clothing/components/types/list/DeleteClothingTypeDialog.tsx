import { AlertDialog } from "@astryxdesign/core/AlertDialog"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"

import type { ClothingType } from "#/clothing/model/clothingType"
import { deleteClothingTypeMutation } from "#/clothing/service/clothingTypesQueries"

interface DeleteClothingTypeDialogProps {
  type: ClothingType
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
}

export default function DeleteClothingTypeDialog({
  type,
  isOpen,
  onOpenChange,
}: DeleteClothingTypeDialogProps) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const queryClient = useQueryClient()
  const { mutate: deleteType, isPending } = useMutation(
    deleteClothingTypeMutation(queryClient),
  )

  function handleOpenChange(open: boolean) {
    onOpenChange(open)
    if (!open) {
      setErrorMessage(null)
    }
  }

  function handleConfirm() {
    setErrorMessage(null)
    deleteType(type.id, {
      onSuccess: () => handleOpenChange(false),
      onError: (error) => {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Der Kleidungstyp konnte nicht gelöscht werden.",
        )
      },
    })
  }

  const confirmationText = `Möchten Sie den Kleidungstyp „${type.name}" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.`

  return (
    <AlertDialog
      isOpen={isOpen}
      onOpenChange={handleOpenChange}
      title="Kleidungstyp löschen"
      description={
        errorMessage === null
          ? confirmationText
          : `${confirmationText}\n${errorMessage}`
      }
      actionLabel="Löschen"
      onAction={handleConfirm}
      cancelLabel="Abbrechen"
      actionVariant="destructive"
      isActionLoading={isPending}
    />
  )
}
