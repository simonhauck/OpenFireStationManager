import { queryOptions, useQuery } from "@tanstack/react-query"

import { client } from "#/api/client"
import { queryKeys } from "#/api/queryKeys"

export type {
  ClothingLocationSizeSummary,
  ClothingTypeSizeSummary,
  SizeGroupSummary,
  SizeSummary,
} from "#/clothing/model/overview"

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
