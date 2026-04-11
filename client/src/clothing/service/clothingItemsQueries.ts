import { mutationOptions, queryOptions, useQuery } from "@tanstack/react-query"
import type { QueryClient } from "@tanstack/react-query"

import { client } from "#/api/client"
import { queryKeys } from "#/api/queryKeys"
import type { components } from "#/api/schema"

export type ClothingItem = components["schemas"]["ClothingItem"]
export type ClothingTypeSizeSummary =
  components["schemas"]["ClothingTypeSizeSummary"]
type CreateOrUpdateClothingItemRequest =
  components["schemas"]["CreateOrUpdateClothingItemRequest"]

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

export const createBatchClothingItemsMutation = (queryClient: QueryClient) =>
  mutationOptions({
    mutationKey: [...queryKeys.clothingItems(), "batch"] as const,
    mutationFn: async (
      items: CreateOrUpdateClothingItemRequest[],
    ): Promise<ClothingItem[]> => {
      const { data, error } = await client.POST("/api/clothing/items/batch", {
        body: { items },
      })
      return ensureData(data, error, "POST /api/clothing/items/batch")
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.clothingItems(),
      })
    },
  })

export function useClothingItems() {
  return useQuery(getAllClothingItemsQuery())
}

export function useClothingTypeSizeSummary() {
  return useQuery(getClothingTypeSizeSummaryQuery())
}
