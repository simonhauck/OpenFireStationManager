import { useParams } from "@tanstack/react-router"

import ClothingItemForm from "#/clothing/components/shared/ClothingItemForm"
import { useClothingItemById } from "#/clothing/service/clothingItemsQueries"
import ErrorState from "#/components/base/ErrorState"
import LoadingIndicator from "#/components/base/LoadingIndicator"

export default function EditClothingItemPage() {
  const { clothingItemId } = useParams({
    from: "/_authenticated/clothing-management/items/$clothingItemId/edit",
  })
  const numericClothingItemId = Number(clothingItemId)

  const {
    data: clothingItem,
    isLoading,
    isError,
  } = useClothingItemById(numericClothingItemId)

  if (!Number.isFinite(numericClothingItemId)) {
    return (
      <div className="px-4 py-12">
        <ErrorState message="Ungültige Kleidungsstück-ID." />
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="px-4 py-12">
        <LoadingIndicator label="Kleidungsstück wird geladen..." />
      </div>
    )
  }

  if (isError || !clothingItem) {
    return (
      <div className="px-4 py-12">
        <ErrorState message="Kleidungsstück konnte nicht geladen werden." />
      </div>
    )
  }

  return <ClothingItemForm existingItem={clothingItem} />
}
