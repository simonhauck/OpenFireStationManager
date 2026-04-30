import type { components } from "#/api/schema"

export type ResolvedClothingItem = components["schemas"]["ResolvedClothingItem"]
export type ClothingLocation = components["schemas"]["ClothingLocation"]
export type ClothingItem = components["schemas"]["ClothingItem"]
export type ClothingType = components["schemas"]["ClothingType"]

/**
 * Given a list of items being taken (with their types) and the items currently
 * at the locker (PERSONAL location), returns the set of item IDs that should
 * be pre-toggled for return.
 *
 * Auto-toggle rule: toggle on all locker items whose ClothingType matches the
 * type of ANY taken item. Size is not considered (ADR-0001).
 */
export function autoToggleReturnsByType(
  takeItems: ResolvedClothingItem[],
  lockerItems: ResolvedClothingItem[],
): Set<number> {
  const takenTypeIds = new Set(takeItems.map((i) => i.clothingType.id))
  const toggled = new Set<number>()
  for (const item of lockerItems) {
    if (takenTypeIds.has(item.clothingType.id)) {
      toggled.add(item.clothingItem.id)
    }
  }
  return toggled
}
