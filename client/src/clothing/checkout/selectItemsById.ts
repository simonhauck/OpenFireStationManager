import type { ResolvedClothingItem } from "#/clothing/model/clothingItems.ts"

export function selectItemsById(
  items: ResolvedClothingItem[],
  ids: ReadonlySet<number>,
): ResolvedClothingItem[] {
  const itemsById = new Map(items.map((item) => [item.clothingItem.id, item]))
  return [...ids].flatMap((id) => {
    const item = itemsById.get(id)
    return item ? [item] : []
  })
}
