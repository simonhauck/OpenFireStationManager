import { mutationOptions } from "@tanstack/react-query"
import type { QueryClient } from "@tanstack/react-query"

import { client } from "#/api/client"
import { queryKeys } from "#/api/queryKeys"
import type { RelocationRequest } from "#/clothing/model/relocation"

export const relocationMutation = (queryClient: QueryClient) =>
  mutationOptions({
    mutationFn: async (body: RelocationRequest): Promise<void> => {
      await client.POST("/api/clothing/relocation", { body })
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.clothingItems(),
      })
    },
  })
