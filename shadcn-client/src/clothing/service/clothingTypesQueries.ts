import { queryOptions, useQuery } from "@tanstack/react-query"

import { client } from "#/api/client"
import { queryKeys } from "#/api/queryKeys"
import type { ClothingType } from "#/clothing/model/clothingType"

export function useClothingTypes() {
  return useQuery(
    queryOptions({
      queryKey: queryKeys.clothingTypes(),
      queryFn: async (): Promise<ClothingType[]> => {
        const { data } = await client.GET("/api/clothing/types")

        if (!data) return []

        return data
      },
    }),
  )
}
