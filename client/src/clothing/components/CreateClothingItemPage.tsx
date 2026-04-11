import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"
import { useState } from "react"

import ClothingItemForm from "#/clothing/components/ClothingItemForm"
import { createClothingItemMutation } from "#/clothing/service/clothingItemsQueries"
import { useClothingTypes } from "#/clothing/service/clothingTypesQueries"
import RoleGuard from "#/components/base/RoleGuard"

export default function CreateClothingItemPage() {
  return (
    <RoleGuard allowedRoles={["KLEIDERWART"]}>
      <CreateClothingItemPageContent />
    </RoleGuard>
  )
}

function CreateClothingItemPageContent() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const [typeId, setTypeId] = useState<number | null>(null)
  const [size, setSize] = useState("")
  const [barcode, setBarcode] = useState("")

  const { data: clothingTypes } = useClothingTypes()

  const {
    mutate: createItem,
    isPending,
    error,
  } = useMutation(createClothingItemMutation(queryClient))

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (typeId === null) return

    createItem(
      { typeId, size, barcode: barcode || undefined },
      {
        onSuccess: () => {
          void navigate({ to: "/clothing-management/items" })
        },
      },
    )
  }

  return (
    <ClothingItemForm
      title="Kleidungsstueck erstellen"
      description="Erfassen Sie die Daten fuer ein neues Kleidungsstueck."
      clothingTypes={clothingTypes ?? []}
      typeId={typeId}
      onTypeIdChange={setTypeId}
      size={size}
      onSizeChange={setSize}
      barcode={barcode}
      onBarcodeChange={setBarcode}
      onSubmit={handleSubmit}
      isPending={isPending}
      pendingLabel="Wird erstellt..."
      submitLabel="Kleidungsstueck erstellen"
      errorMessage={
        error ? "Das Kleidungsstueck konnte nicht erstellt werden." : null
      }
    />
  )
}
