import type { QueryClient } from "@tanstack/react-query"
import { mutationOptions, queryOptions, useQuery } from "@tanstack/react-query"

import { client } from "#/api/client"
import { queryKeys } from "#/api/queryKeys"
import type {
  ClothingType,
  CreateOrUpdateClothingTypeRequest,
} from "#/clothing/model/clothingType"

type UpdateClothingTypeVariables = {
  id: number
  body: CreateOrUpdateClothingTypeRequest
}

export const getAllClothingTypesQuery = () =>
  queryOptions({
    queryKey: queryKeys.clothingTypes(),
    queryFn: async (): Promise<ClothingType[]> => {
      const { data } = await client.GET("/api/clothing/types")
      return data!
    },
  })

export const getClothingTypeByIdQuery = (id: number) =>
  queryOptions({
    queryKey: queryKeys.clothingType(id),
    queryFn: async (): Promise<ClothingType> => {
      const { data } = await client.GET("/api/clothing/types/{id}", {
        params: { path: { id } },
      })
      return data!
    },
  })

export const createClothingTypeMutation = (queryClient: QueryClient) =>
  mutationOptions({
    mutationKey: [...queryKeys.clothingTypes(), "create"] as const,
    mutationFn: async (
      body: CreateOrUpdateClothingTypeRequest,
    ): Promise<ClothingType> => {
      const { data } = await client.POST("/api/clothing/types", { body })
      return data!
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.clothingTypes(),
      })
    },
  })

export const updateClothingTypeMutation = (queryClient: QueryClient) =>
  mutationOptions({
    mutationKey: [...queryKeys.clothingTypes(), "update"] as const,
    mutationFn: async (
      variables: UpdateClothingTypeVariables,
    ): Promise<ClothingType> => {
      const { data } = await client.PATCH("/api/clothing/types/{id}", {
        params: { path: { id: variables.id } },
        body: variables.body,
      })
      return data!
    },
    onSuccess: async (_, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.clothingTypes() }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.clothingType(variables.id),
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.clothingTypeSizeSummary(),
        }),
      ])
    },
  })

export const deleteClothingTypeMutation = (queryClient: QueryClient) =>
  mutationOptions({
    mutationKey: [...queryKeys.clothingTypes(), "delete"] as const,
    mutationFn: async (id: number): Promise<void> => {
      await client.DELETE("/api/clothing/types/{id}", {
        params: { path: { id } },
      })
    },
    onSuccess: async (_, id) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.clothingTypes() }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.clothingType(id),
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.clothingTypeSizeSummary(),
        }),
      ])
    },
  })

export function useClothingTypes() {
  return useQuery(getAllClothingTypesQuery())
}

export function useClothingTypeById(id: number) {
  return useQuery({
    ...getClothingTypeByIdQuery(id),
    enabled: Number.isFinite(id),
  })
}
