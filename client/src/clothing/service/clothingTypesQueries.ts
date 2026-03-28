import { mutationOptions, queryOptions, useQuery } from "@tanstack/react-query"
import type { QueryClient } from "@tanstack/react-query"

import { client } from "#/api/client"
import { queryKeys } from "#/api/queryKeys"
import type { components } from "#/api/schema"
import type { ClothingType } from "#/clothing/model/clothingType"

type CreateOrUpdateClothingTypeRequest =
  components["schemas"]["CreateOrUpdateClothingTypeRequest"]

type UpdateClothingTypeVariables = {
  id: number
  body: CreateOrUpdateClothingTypeRequest
}

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

export const getAllClothingTypesQuery = () =>
  queryOptions({
    queryKey: queryKeys.clothingTypes(),
    queryFn: async (): Promise<ClothingType[]> => {
      const { data, error } = await client.GET("/api/clothing/types")
      return ensureData(data, error, "GET /api/clothing/types")
    },
  })

export const getClothingTypeByIdQuery = (id: number) =>
  queryOptions({
    queryKey: queryKeys.clothingType(id),
    queryFn: async (): Promise<ClothingType> => {
      const { data, error } = await client.GET("/api/clothing/types/{id}", {
        params: {
          path: { id },
        },
      })

      return ensureData(data, error, "GET /api/clothing/types/{id}")
    },
  })

export const createClothingTypeMutation = (queryClient: QueryClient) =>
  mutationOptions({
    mutationKey: [...queryKeys.clothingTypes(), "create"] as const,
    mutationFn: async (
      body: CreateOrUpdateClothingTypeRequest,
    ): Promise<ClothingType> => {
      const { data, error } = await client.POST("/api/clothing/types", {
        body,
      })

      return ensureData(data, error, "POST /api/clothing/types")
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.clothingTypes() })
    },
  })

export const updateClothingTypeMutation = (queryClient: QueryClient) =>
  mutationOptions({
    mutationKey: [...queryKeys.clothingTypes(), "update"] as const,
    mutationFn: async (
      variables: UpdateClothingTypeVariables,
    ): Promise<ClothingType> => {
      const { data, error } = await client.PATCH("/api/clothing/types/{id}", {
        params: {
          path: { id: variables.id },
        },
        body: variables.body,
      })

      return ensureData(data, error, "PATCH /api/clothing/types/{id}")
    },
    onSuccess: async (_, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.clothingTypes() }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.clothingType(variables.id),
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
