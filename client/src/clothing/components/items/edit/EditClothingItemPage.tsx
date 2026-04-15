import { useParams } from "@tanstack/react-router"

import ClothingItemForm from "#/clothing/components/shared/ClothingItemForm"
import { useClothingItemById } from "#/clothing/service/clothingItemsQueries"
import ErrorState from "#/components/base/ErrorState"
import LoadingIndicator from "#/components/base/LoadingIndicator"

export default function EditClothingItemPage() {
  const { clothingItemId } = useParams({
    from: "/clothing-management/items/$clothingItemId/edit",
  })
  const numericClothingItemId = Number(clothingItemId)

  const {
    data: clothingItem,
    isLoading,
    isError,
  } = useClothingItemById(numericClothingItemId)

  if (!Number.isFinite(numericClothingItemId)) {
    return (
      <main className="page-wrap px-4 py-12">
        <ErrorState message="Ungueltige Kleidungsstueck-ID." />
      </main>
    )
  }

  if (isLoading) {
    return (
      <main className="page-wrap px-4 py-12">
        <LoadingIndicator label="Kleidungsstueck wird geladen..." />
      </main>
    )
  }

  if (isError || !clothingItem) {
    return (
      <main className="page-wrap px-4 py-12">
        <ErrorState message="Kleidungsstueck konnte nicht geladen werden." />
      </main>
    )
  }

  return <ClothingItemForm existingItem={clothingItem} />
}
