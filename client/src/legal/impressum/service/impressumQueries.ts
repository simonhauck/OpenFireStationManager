import { mutationOptions, queryOptions } from "@tanstack/react-query"
import type { QueryClient } from "@tanstack/react-query"

import { client } from "#/api/client"
import { queryKeys } from "#/api/queryKeys"
import type { components } from "#/api/schema"

export type ImpressumResponse = components["schemas"]["ImpressumResponse"]
export type ImpressumRequest = components["schemas"]["ImpressumRequest"]
export type ImpressumExists = components["schemas"]["ImpressumExists"]

export type ImpressumState =
  | { exists: false; impressum: null }
  | { exists: true; impressum: ImpressumResponse }

export const impressumAdminQuery = () =>
  queryOptions({
    queryKey: queryKeys.impressum(),
    queryFn: async (): Promise<ImpressumState> => {
      const { data: existsData } = await client.GET("/api/admin/impressum/exists")
      if (!existsData?.exists) {
        return { exists: false, impressum: null }
      }
      const { data } = await client.GET("/api/admin/impressum")
      return { exists: true, impressum: data! }
    },
  })

export const impressumPublicQuery = () =>
  queryOptions({
    queryKey: [...queryKeys.impressum(), "public"] as const,
    queryFn: async (): Promise<ImpressumState> => {
      const { data: existsData } = await client.GET("/api/public/impressum/exists")
      if (!existsData?.exists) {
        return { exists: false, impressum: null }
      }
      const { data } = await client.GET("/api/public/impressum")
      return { exists: true, impressum: data! }
    },
  })

export const upsertImpressumMutation = (queryClient: QueryClient) =>
  mutationOptions({
    mutationFn: async (request: ImpressumRequest): Promise<ImpressumResponse> => {
      const { data } = await client.PUT("/api/admin/impressum", { body: request })
      return data!
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.impressum() })
    },
  })

export const deleteImpressumMutation = (queryClient: QueryClient) =>
  mutationOptions({
    mutationFn: async (): Promise<void> => {
      await client.DELETE("/api/admin/impressum")
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.impressum() })
    },
  })
