import { mutationOptions, queryOptions, useQuery } from "@tanstack/react-query"
import type { QueryClient } from "@tanstack/react-query"

import { client } from "#/api/client"
import { queryKeys } from "#/api/queryKeys"
import type { components } from "#/api/schema"

type ClothingLocation = components["schemas"]["ClothingLocation"]
type CreateClothingLocationRequest =
  components["schemas"]["CreateClothingLocationRequest"]
type BatchCreateClothingLocationsRequest =
  components["schemas"]["BatchCreateClothingLocationsRequest"]

type UpdateClothingLocationVariables = {
  id: number
  body: CreateClothingLocationRequest
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

export const getAllClothingLocationsQuery = () =>
  queryOptions({
    queryKey: queryKeys.clothingLocations(),
    queryFn: async (): Promise<ClothingLocation[]> => {
      const { data, error } = await client.GET("/api/clothing/locations")
      return ensureData(data, error, "GET /api/clothing/locations")
    },
  })

export const getClothingLocationByIdQuery = (id: number) =>
  queryOptions({
    queryKey: queryKeys.clothingLocation(id),
    queryFn: async (): Promise<ClothingLocation> => {
      const { data, error } = await client.GET(
        "/api/clothing/locations/{id}",
        { params: { path: { id } } },
      )
      return ensureData(data, error, "GET /api/clothing/locations/{id}")
    },
  })

export const createClothingLocationMutation = (queryClient: QueryClient) =>
  mutationOptions({
    mutationKey: [...queryKeys.clothingLocations(), "create"] as const,
    mutationFn: async (
      body: CreateClothingLocationRequest,
    ): Promise<ClothingLocation> => {
      const { data, error } = await client.POST("/api/clothing/locations", {
        body,
      })
      return ensureData(data, error, "POST /api/clothing/locations")
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.clothingLocations(),
      })
    },
  })

export const batchCreateClothingLocationsMutation = (
  queryClient: QueryClient,
) =>
  mutationOptions({
    mutationKey: [...queryKeys.clothingLocations(), "batch-create"] as const,
    mutationFn: async (
      body: BatchCreateClothingLocationsRequest,
    ): Promise<ClothingLocation[]> => {
      const { data, error } = await client.POST(
        "/api/clothing/locations/batch",
        { body },
      )
      return ensureData(data, error, "POST /api/clothing/locations/batch")
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.clothingLocations(),
      })
    },
  })

export const updateClothingLocationMutation = (queryClient: QueryClient) =>
  mutationOptions({
    mutationKey: [...queryKeys.clothingLocations(), "update"] as const,
    mutationFn: async (
      variables: UpdateClothingLocationVariables,
    ): Promise<ClothingLocation> => {
      const { data, error } = await client.PATCH(
        "/api/clothing/locations/{id}",
        {
          params: { path: { id: variables.id } },
          body: variables.body,
        },
      )
      return ensureData(data, error, "PATCH /api/clothing/locations/{id}")
    },
    onSuccess: async (_, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: queryKeys.clothingLocations(),
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.clothingLocation(variables.id),
        }),
      ])
    },
  })

export function useClothingLocations() {
  return useQuery(getAllClothingLocationsQuery())
}

export function useClothingLocationById(id: number) {
  return useQuery({
    ...getClothingLocationByIdQuery(id),
    enabled: Number.isFinite(id),
  })
}

export type {
  ClothingLocation,
  CreateClothingLocationRequest,
  BatchCreateClothingLocationsRequest,
}
