import { queryOptions, useQuery } from "@tanstack/react-query"

import { client } from "#/api/client"
import { queryKeys } from "#/api/queryKeys"
import type { components } from "#/api/schema"

export type ClothingLocationSizeSummary =
  components["schemas"]["ClothingLocationSizeSummary"]

const ensureData = <T>(
  data: T | undefined,
  error: unknown,
  requestName: string,
): T => {
  if (error) {
    throw error
  }

  if (data === undefined) {
    throw new Error(`${requestName} returned no data`)
  }

  return data
}

export const getClothingOverviewQuery = () =>
  queryOptions({
    queryKey: queryKeys.clothingOverview(),
    queryFn: async (): Promise<ClothingLocationSizeSummary[]> => {
      const { data, error } = await client.GET("/api/clothing/overview")
      return ensureData(data, error, "GET /api/clothing/overview")
    },
  })

export function useClothingOverview() {
  return useQuery(getClothingOverviewQuery())
}
