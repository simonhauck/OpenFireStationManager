import { queryOptions, useQuery } from "@tanstack/react-query"

import { client, ensureData } from "#/api/client"
import { queryKeys } from "#/api/queryKeys"
import type {
  ClothingLocationSizeSummary,
  ClothingTypeSizeSummary,
} from "#/clothing/model/overview.ts"

export const getClothingOverviewQuery = () =>
  queryOptions({
    queryKey: queryKeys.clothingOverview(),
    queryFn: async (): Promise<ClothingLocationSizeSummary[]> => {
      const { data, error } = await client.GET(
        "/api/clothing/overview/dashboard/location",
      )
      return ensureData(
        data,
        error,
        "GET /api/clothing/overview/dashboard/location",
      )
    },
  })

export const getClothingTypeSizeSummaryQuery = () =>
  queryOptions({
    queryKey: queryKeys.clothingTypeSizeSummary(),
    queryFn: async (): Promise<ClothingTypeSizeSummary[]> => {
      const { data, error } = await client.GET(
        "/api/clothing/overview/summary/type",
      )
      return ensureData(data, error, "GET /api/clothing/overview/summary/type")
    },
  })

export function useClothingOverview() {
  return useQuery(getClothingOverviewQuery())
}

export function useClothingTypeSizeSummary() {
  return useQuery(getClothingTypeSizeSummaryQuery())
}
