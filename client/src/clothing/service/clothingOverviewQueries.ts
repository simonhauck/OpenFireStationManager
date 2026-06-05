import { queryOptions, useQuery } from "@tanstack/react-query"

import { client } from "#/api/client"
import { queryKeys } from "#/api/queryKeys"
import type {
  ClothingLocationSizeSummary,
  ClothingTypeSizeSummary,
} from "#/clothing/model/overview.ts"

export const getClothingOverviewQuery = () =>
  queryOptions({
    queryKey: queryKeys.clothingOverview(),
    queryFn: async (): Promise<ClothingLocationSizeSummary[]> => {
      const { data } = await client.GET(
        "/api/clothing/overview/dashboard/location",
      )
      return data!
    },
  })

export const getClothingTypeSizeSummaryQuery = () =>
  queryOptions({
    queryKey: queryKeys.clothingTypeSizeSummary(),
    queryFn: async (): Promise<ClothingTypeSizeSummary[]> => {
      const { data } = await client.GET("/api/clothing/overview/summary/type")
      return data!
    },
  })

export function useClothingOverview() {
  return useQuery(getClothingOverviewQuery())
}

export function useClothingTypeSizeSummary() {
  return useQuery(getClothingTypeSizeSummaryQuery())
}
