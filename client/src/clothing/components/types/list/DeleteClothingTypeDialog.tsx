import { useMutation, useQueryClient } from "@tanstack/react-query"
import type { ReactNode } from "react"
import { useState } from "react"

import type { ClothingType } from "#/clothing/model/clothingType"
import { deleteClothingTypeMutation } from "#/clothing/service/clothingTypesQueries"
import RenderIf from "#/components/base/RenderIf"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "#/components/ui/alert-dialog"
import { Button } from "#/components/ui/button"

interface DeleteClothingTypeDialogProps {
  type: ClothingType
  children: ReactNode
}

export default function DeleteClothingTypeDialog({
  type,
  children,
}: DeleteClothingTypeDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const queryClient = useQueryClient()
  const { mutate: deleteType, isPending } = useMutation(
    deleteClothingTypeMutation(queryClient),
  )

  function handleOpenChange(open: boolean) {
    setIsOpen(open)
    if (!open) {
      setErrorMessage(null)
    }
  }

  function handleConfirm() {
    setErrorMessage(null)
    deleteType(type.id, {
      onSuccess: () => setIsOpen(false),
      onError: (error) => {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Der Kleidungstyp konnte nicht gelöscht werden.",
        )
      },
    })
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={handleOpenChange}>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Kleidungstyp löschen</AlertDialogTitle>
          <AlertDialogDescription>
            Möchten Sie den Kleidungstyp „{type.name}" wirklich löschen? Diese
            Aktion kann nicht rückgängig gemacht werden.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <RenderIf when={errorMessage !== null}>
          <p className="text-sm text-destructive">{errorMessage}</p>
        </RenderIf>

        <AlertDialogFooter>
          <AlertDialogCancel>Abbrechen</AlertDialogCancel>
          <Button onClick={handleConfirm} disabled={isPending}>
            {isPending ? "Wird gelöscht..." : "Löschen"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
