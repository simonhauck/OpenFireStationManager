import { mutationOptions } from "@tanstack/react-query"

import { client } from "#/api/client"
import type { components } from "#/api/schema"

export type RelocationRequest = components["schemas"]["RelocationRequest"]

export const relocationMutation = () =>
  mutationOptions({
    mutationFn: async (body: RelocationRequest): Promise<void> => {
      const { data, error } = await client.POST("/api/clothing/relocation", {
        body,
      })
      if (error) throw error
      return data
    },
  })
