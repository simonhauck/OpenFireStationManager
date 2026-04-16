import { mutationOptions, queryOptions, useQuery } from "@tanstack/react-query"
import type { QueryClient } from "@tanstack/react-query"

import { client } from "#/api/client"
import { queryKeys } from "#/api/queryKeys"
import type { components } from "#/api/schema"

type ClothingLocation = components["schemas"]["ClothingLocation"]
type CreateClothingLocationRequest =
  components["schemas"]["CreateClothingLocationRequest"]

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

export function useClothingLocations() {
  return useQuery(getAllClothingLocationsQuery())
}

export type { ClothingLocation, CreateClothingLocationRequest }
