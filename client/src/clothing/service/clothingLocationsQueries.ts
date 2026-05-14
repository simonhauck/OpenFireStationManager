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
type LocationType = CreateClothingLocationRequest["type"]

type UpdateClothingLocationVariables = {
  id: number
  body: CreateClothingLocationRequest
}

export const getAllClothingLocationsQuery = () =>
  queryOptions({
    queryKey: queryKeys.clothingLocations(),
    queryFn: async (): Promise<ClothingLocation[]> => {
      const { data } = await client.GET("/api/clothing/locations")
      return data!
    },
  })

export const getClothingLocationByIdQuery = (id: number) =>
  queryOptions({
    queryKey: queryKeys.clothingLocation(id),
    queryFn: async (): Promise<ClothingLocation> => {
      const { data } = await client.GET("/api/clothing/locations/{id}", {
        params: { path: { id } },
      })
      return data!
    },
  })

export const createClothingLocationMutation = (queryClient: QueryClient) =>
  mutationOptions({
    mutationKey: [...queryKeys.clothingLocations(), "create"] as const,
    mutationFn: async (
      body: CreateClothingLocationRequest,
    ): Promise<ClothingLocation> => {
      const { data } = await client.POST("/api/clothing/locations", { body })
      return data!
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
      const { data } = await client.POST("/api/clothing/locations/batch", {
        body,
      })
      return data!
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
      const { data } = await client.PATCH("/api/clothing/locations/{id}", {
        params: { path: { id: variables.id } },
        body: variables.body,
      })
      return data!
    },
    onSuccess: async (_, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: queryKeys.clothingLocations(),
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.clothingLocation(variables.id),
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.clothingOverview(),
        }),
      ])
    },
  })

export const deleteClothingLocationMutation = (queryClient: QueryClient) =>
  mutationOptions({
    mutationKey: [...queryKeys.clothingLocations(), "delete"] as const,
    mutationFn: async (id: number): Promise<void> => {
      await client.DELETE("/api/clothing/locations/{id}", {
        params: { path: { id } },
      })
    },
    onSuccess: async (_, id) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: queryKeys.clothingLocations(),
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.clothingLocation(id),
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.clothingOverview(),
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
  LocationType,
}
