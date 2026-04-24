import { queryOptions, useQuery } from "@tanstack/react-query"

import { client } from "#/api/client"
import { queryKeys } from "#/api/queryKeys"
import type { components } from "#/api/schema"

export type ClothingLocationSizeSummary =
  components["schemas"]["ClothingLocationSummary"]
export type ClothingTypeSizeSummary =
  components["schemas"]["ClothingTypeSummary"]

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
