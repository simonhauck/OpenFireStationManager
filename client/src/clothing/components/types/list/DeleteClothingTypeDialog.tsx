import { Button } from "@astryxdesign/core/Button"
import { Dialog, DialogHeader } from "@astryxdesign/core/Dialog"
import { Text } from "@astryxdesign/core/Text"
import { VStack } from "@astryxdesign/core/VStack"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"

import type { ClothingType } from "#/clothing/model/clothingType"
import { deleteClothingTypeMutation } from "#/clothing/service/clothingTypesQueries"
import RenderIf from "#/components/base/RenderIf"

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

  return (
    <Dialog
      isOpen={isOpen}
      onOpenChange={handleOpenChange}
      width={448}
      purpose="required"
    >
      <VStack gap={3}>
        <DialogHeader
          title="Kleidungstyp löschen"
          onOpenChange={handleOpenChange}
        />

        <Text as="p" type="body">
          Möchten Sie den Kleidungstyp „{type.name}" wirklich löschen? Diese
          Aktion kann nicht rückgängig gemacht werden.
        </Text>

        <RenderIf when={errorMessage !== null}>
          <Text as="p" type="body" color="error">
            {errorMessage}
          </Text>
        </RenderIf>

        <div className="flex flex-wrap justify-end gap-2">
          <Button
            label="Abbrechen"
            variant="secondary"
            onClick={() => handleOpenChange(false)}
            isDisabled={isPending}
          />
          <Button
            label="Löschen"
            variant="destructive"
            onClick={handleConfirm}
            isLoading={isPending}
          />
        </div>
      </VStack>
    </Dialog>
  )
}
