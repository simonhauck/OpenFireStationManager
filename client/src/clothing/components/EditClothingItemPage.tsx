import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useNavigate, useParams } from "@tanstack/react-router"
import { useEffect, useState } from "react"

import ClothingItemForm from "#/clothing/components/ClothingItemForm"
import {
  updateClothingItemMutation,
  useClothingItemById,
} from "#/clothing/service/clothingItemsQueries"
import { useClothingTypes } from "#/clothing/service/clothingTypesQueries"
import ErrorState from "#/components/base/ErrorState"
import LoadingIndicator from "#/components/base/LoadingIndicator"
import RoleGuard from "#/components/base/RoleGuard"

export default function EditClothingItemPage() {
  return (
    <RoleGuard allowedRoles={["KLEIDERWART"]}>
      <EditClothingItemPageContent />
    </RoleGuard>
  )
}

function EditClothingItemPageContent() {
  const { clothingItemId } = useParams({
    from: "/clothing-management/items/$clothingItemId/edit",
  })
  const numericClothingItemId = Number(clothingItemId)

  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const [typeId, setTypeId] = useState<number | null>(null)
  const [size, setSize] = useState("")
  const [barcode, setBarcode] = useState("")

  const {
    data: clothingItem,
    isLoading: isItemLoading,
    isError: isItemError,
  } = useClothingItemById(numericClothingItemId)

  const {
    data: clothingTypes,
    isLoading: isTypesLoading,
    isError: isTypesError,
  } = useClothingTypes()

  const {
    mutate: updateItem,
    isPending,
    error,
  } = useMutation(updateClothingItemMutation(queryClient))

  useEffect(() => {
    if (!clothingItem) {
      return
    }

    setTypeId(Number(clothingItem.typeId))
    setSize(clothingItem.size)
    setBarcode(clothingItem.barcode ?? "")
  }, [clothingItem])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (typeId === null) return

    updateItem(
      {
        id: numericClothingItemId,
        body: { typeId, size, barcode: barcode || undefined },
      },
      {
        onSuccess: () => {
          void navigate({ to: "/clothing-management/items" })
        },
      },
    )
  }

  if (!Number.isFinite(numericClothingItemId)) {
    return (
      <main className="page-wrap px-4 py-12">
        <ErrorState message="Ungueltige Kleidungsstueck-ID." />
      </main>
    )
  }

  if (isItemLoading || isTypesLoading) {
    return (
      <main className="page-wrap px-4 py-12">
        <LoadingIndicator label="Kleidungsstueck wird geladen..." />
      </main>
    )
  }

  if (isItemError || !clothingItem || isTypesError) {
    return (
      <main className="page-wrap px-4 py-12">
        <ErrorState message="Kleidungsstueck konnte nicht geladen werden." />
      </main>
    )
  }

  return (
    <ClothingItemForm
      title="Kleidungsstueck bearbeiten"
      description="Bearbeiten Sie die Daten des Kleidungsstuecks."
      clothingTypes={clothingTypes ?? []}
      typeId={typeId}
      onTypeIdChange={setTypeId}
      size={size}
      onSizeChange={setSize}
      barcode={barcode}
      onBarcodeChange={setBarcode}
      onSubmit={handleSubmit}
      isPending={isPending}
      pendingLabel="Wird gespeichert..."
      submitLabel="Aenderungen speichern"
      errorMessage={
        error ? "Das Kleidungsstueck konnte nicht aktualisiert werden." : null
      }
    />
  )
}
