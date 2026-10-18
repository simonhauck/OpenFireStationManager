import { AlertDialog } from "@astryxdesign/core/AlertDialog"
import { useMutation, useQueryClient } from "@tanstack/react-query"

import type { ClothingLocation } from "#/clothing/model/clothingLocations"
import { deleteClothingLocationMutation } from "#/clothing/service/clothingLocationsQueries"

interface DeleteClothingLocationDialogProps {
  location: Pick<ClothingLocation, "id" | "name">
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  onDeleted?: () => void
}

export default function DeleteClothingLocationDialog({
  location,
  isOpen,
  onOpenChange,
  onDeleted,
}: DeleteClothingLocationDialogProps) {
  const queryClient = useQueryClient()
  const { mutate, isPending } = useMutation(
    deleteClothingLocationMutation(queryClient),
  )

  function handleDelete() {
    mutate(location.id, {
      onSuccess: () => {
        onOpenChange(false)
        onDeleted?.()
      },
    })
  }

  return (
    <AlertDialog
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title="Standort löschen"
      description={`Möchten Sie den Standort „${location.name}“ wirklich löschen? Kleidungsstücke an diesem Standort verlieren dabei ihre Standortzuordnung. Diese Aktion kann nicht rückgängig gemacht werden.`}
      actionLabel="Löschen"
      onAction={handleDelete}
      cancelLabel="Abbrechen"
      actionVariant="destructive"
      isActionLoading={isPending}
    />
  )
}
