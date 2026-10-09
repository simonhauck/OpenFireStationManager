import { useQuery } from "@tanstack/react-query"
import { useMemo } from "react"

import type { ResolvedClothingItem } from "#/clothing/model/clothingItems.ts"
import { getAllClothingItemsQuery } from "#/clothing/service/clothingItemsQueries"
import { getAllClothingLocationsQuery } from "#/clothing/service/clothingLocationsQueries"
import { getAllClothingTypesQuery } from "#/clothing/service/clothingTypesQueries"

/**
 * Every clothing item with its type and current location resolved, so scanned
 * items, search results and locker contents can be rendered without follow-up
 * lookups.
 */
export function useResolvedClothingItems(): ResolvedClothingItem[] {
  const { data: allItems } = useQuery(getAllClothingItemsQuery())
  const { data: allTypes } = useQuery(getAllClothingTypesQuery())
  const { data: allLocations } = useQuery(getAllClothingLocationsQuery())

  return useMemo(() => {
    if (!allItems || !allTypes) return []
    const typeMap = new Map(allTypes.map((t) => [t.id, t]))
    const locationMap = new Map((allLocations ?? []).map((l) => [l.id, l]))
    return allItems.flatMap((item) => {
      const type = typeMap.get(item.typeId)
      if (!type) return []
      const location =
        item.locationId !== undefined
          ? locationMap.get(item.locationId)
          : undefined
      return [{ clothingItem: item, clothingType: type, location }]
    })
  }, [allItems, allTypes, allLocations])
}
