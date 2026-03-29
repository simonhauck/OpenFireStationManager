import { queryOptions, useQuery } from "@tanstack/react-query"

import { client } from "#/api/client"
import { queryKeys } from "#/api/queryKeys"
import type { components } from "#/api/schema"

export type ClothingItem = components["schemas"]["ClothingItem"]
export type ClothingTypeSizeSummary =
  components["schemas"]["ClothingTypeSizeSummary"]

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

export const getAllClothingItemsQuery = () =>
  queryOptions({
    queryKey: queryKeys.clothingItems(),
    queryFn: async (): Promise<ClothingItem[]> => {
      const { data, error } = await client.GET("/api/clothing/items")
      return ensureData(data, error, "GET /api/clothing/items")
    },
  })

export const getClothingTypeSizeSummaryQuery = () =>
  queryOptions({
    queryKey: queryKeys.clothingTypeSizeSummary(),
    queryFn: async (): Promise<ClothingTypeSizeSummary[]> => {
      const { data, error } = await client.GET("/api/clothing/items/summary")
      return ensureData(data, error, "GET /api/clothing/items/summary")
    },
  })

export function useClothingItems() {
  return useQuery(getAllClothingItemsQuery())
}

export function useClothingTypeSizeSummary() {
  return useQuery(getClothingTypeSizeSummaryQuery())
}
