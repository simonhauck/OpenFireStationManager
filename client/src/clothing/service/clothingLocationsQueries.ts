import { queryOptions, useQuery } from "@tanstack/react-query"

import { client } from "#/api/client"
import { queryKeys } from "#/api/queryKeys"
import type { components } from "#/api/schema"

export type ClothingLocation = components["schemas"]["ClothingLocation"]
export type CreateOrUpdateClothingLocationRequest =
  components["schemas"]["CreateOrUpdateClothingLocationRequest"]

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

export function useClothingLocations() {
  return useQuery(getAllClothingLocationsQuery())
}
