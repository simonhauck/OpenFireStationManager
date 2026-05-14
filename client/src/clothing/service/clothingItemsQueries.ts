import { mutationOptions, queryOptions, useQuery } from "@tanstack/react-query"
import type { QueryClient } from "@tanstack/react-query"

import { client } from "#/api/client"
import { queryKeys } from "#/api/queryKeys"
import type { components } from "#/api/schema"

export type ClothingItem = components["schemas"]["ClothingItem"]
type CreateOrUpdateClothingItemRequest =
  components["schemas"]["CreateOrUpdateClothingItemRequest"]

type UpdateClothingItemVariables = {
  id: number
  body: CreateOrUpdateClothingItemRequest
}

export const getAllClothingItemsQuery = () =>
  queryOptions({
    queryKey: queryKeys.clothingItems(),
    queryFn: async (): Promise<ClothingItem[]> => {
      const { data } = await client.GET("/api/clothing/items")
      return data!
    },
  })

export const getClothingItemByIdQuery = (id: number) =>
  queryOptions({
    queryKey: queryKeys.clothingItem(id),
    queryFn: async (): Promise<ClothingItem> => {
      const { data } = await client.GET("/api/clothing/items/{id}", {
        params: { path: { id } },
      })
      return data!
    },
  })

export const createClothingItemMutation = (queryClient: QueryClient) =>
  mutationOptions({
    mutationKey: [...queryKeys.clothingItems(), "create"] as const,
    mutationFn: async (
      body: CreateOrUpdateClothingItemRequest,
    ): Promise<ClothingItem> => {
      const { data } = await client.POST("/api/clothing/items", { body })
      return data!
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.clothingItems(),
      })
    },
  })

export const updateClothingItemMutation = (queryClient: QueryClient) =>
  mutationOptions({
    mutationKey: [...queryKeys.clothingItems(), "update"] as const,
    mutationFn: async (
      variables: UpdateClothingItemVariables,
    ): Promise<ClothingItem> => {
      const { data } = await client.PATCH("/api/clothing/items/{id}", {
        params: { path: { id: variables.id } },
        body: variables.body,
      })
      return data!
    },
    onSuccess: async (_, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.clothingItems() }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.clothingItem(variables.id),
        }),
      ])
    },
  })

export const deleteClothingItemMutation = (queryClient: QueryClient) =>
  mutationOptions({
    mutationKey: [...queryKeys.clothingItems(), "delete"] as const,
    mutationFn: async (id: number): Promise<void> => {
      await client.DELETE("/api/clothing/items/{id}", {
        params: { path: { id } },
      })
    },
    onSuccess: async (_, id) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.clothingItems() }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.clothingItem(id),
        }),
      ])
    },
  })

export const createBatchClothingItemsMutation = (queryClient: QueryClient) =>
  mutationOptions({
    mutationKey: [...queryKeys.clothingItems(), "batch"] as const,
    mutationFn: async (
      items: CreateOrUpdateClothingItemRequest[],
    ): Promise<ClothingItem[]> => {
      const { data } = await client.POST("/api/clothing/items/batch", {
        body: { items },
      })
      return data!
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

export function useClothingItemById(id: number) {
  return useQuery({
    ...getClothingItemByIdQuery(id),
    enabled: Number.isFinite(id),
  })
}
