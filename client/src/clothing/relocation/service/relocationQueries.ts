import { mutationOptions } from "@tanstack/react-query"
import type { QueryClient } from "@tanstack/react-query"

import { client } from "#/api/client"
import { queryKeys } from "#/api/queryKeys"
import type { components } from "#/api/schema"

export type RelocationRequest = components["schemas"]["RelocationRequest"]

export const relocationMutation = (queryClient: QueryClient) =>
  mutationOptions({
    mutationFn: async (body: RelocationRequest): Promise<void> => {
      await client.POST("/api/clothing/relocation", { body })
    },
    onSuccess: async () => {
      // Invalidating clothingItems() covers item details, the location-based
      // overview and the type-size summary in one call.
      await queryClient.invalidateQueries({
        queryKey: queryKeys.clothingItems(),
      })
    },
  })
