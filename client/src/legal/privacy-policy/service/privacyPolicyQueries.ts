import type { QueryClient } from "@tanstack/react-query"
import { mutationOptions, queryOptions } from "@tanstack/react-query"

import { client, ensureData } from "#/api/client"
import { queryKeys } from "#/api/queryKeys"
import type { PrivacyPolicyMetadata } from "#/legal/model/legal"

export type PrivacyPolicyState =
  | { exists: false; metadata: null }
  | { exists: true; metadata: PrivacyPolicyMetadata }

export const privacyPolicyQuery = () =>
  queryOptions({
    queryKey: queryKeys.privacyPolicy(),
    queryFn: async (): Promise<PrivacyPolicyState> => {
      const { data: existsData } = await client.GET(
        "/api/admin/privacy-policy/exists",
      )
      if (!existsData?.exists) {
        return { exists: false, metadata: null }
      }
      const { data: metadata, error } = await client.GET(
        "/api/admin/privacy-policy",
      )
      return {
        exists: true,
        metadata: ensureData(metadata, error, "GET /api/admin/privacy-policy"),
      }
    },
  })

export const privacyPolicyPublicQuery = () =>
  queryOptions({
    queryKey: [...queryKeys.privacyPolicy(), "public"] as const,
    queryFn: async (): Promise<{ exists: boolean }> => {
      const { data } = await client.GET("/api/public/privacy-policy/exists")
      return { exists: data?.exists ?? false }
    },
  })

export const uploadPrivacyPolicyMutation = (queryClient: QueryClient) =>
  mutationOptions({
    mutationKey: [...queryKeys.privacyPolicy(), "upload"] as const,
    mutationFn: async (file: File): Promise<PrivacyPolicyMetadata> => {
      const formData = new FormData()
      formData.append("file", file)

      const { data, error } = await client.POST("/api/admin/privacy-policy", {
        body: formData as unknown as { file: string },
      })
      return ensureData(data, error, "POST /api/admin/privacy-policy")
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.privacyPolicy(),
      })
    },
  })

export const deletePrivacyPolicyMutation = (queryClient: QueryClient) =>
  mutationOptions({
    mutationKey: [...queryKeys.privacyPolicy(), "delete"] as const,
    mutationFn: async (): Promise<void> => {
      await client.DELETE("/api/admin/privacy-policy")
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.privacyPolicy(),
      })
    },
  })
