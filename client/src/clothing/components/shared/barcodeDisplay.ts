import type { ClothingItem } from "#/clothing/model/clothingItems.ts"

/**
 * The barcode to show on a secondary line: the station `Barcode` when present,
 * otherwise the `Hersteller-Barcode`. Either resolves the item when scanned, so
 * a row never shows two barcode lines.
 */
export function displayBarcode(item: ClothingItem): string | undefined {
  return item.barcode ?? item.manufacturerBarcode ?? undefined
}
