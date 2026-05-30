import { mutationOptions, queryOptions } from "@tanstack/react-query"
import type { QueryClient } from "@tanstack/react-query"

import { client } from "#/api/client"
import { queryKeys } from "#/api/queryKeys"
import type { components } from "#/api/schema"

export type PrivacyPolicyMetadata =
  components["schemas"]["PrivacyPolicyMetadata"]
export type PrivacyPolicyExistsResponse =
  components["schemas"]["PrivacyPolicyExists"]

export const privacyPolicyExistsQuery = () =>
  queryOptions({
    queryKey: queryKeys.privacyPolicyExists(),
    queryFn: async (): Promise<PrivacyPolicyExistsResponse> => {
      const { data } = await client.GET("/api/admin/privacy-policy/exists")
      return data!
    },
  })

export const privacyPolicyQuery = () =>
  queryOptions({
    queryKey: queryKeys.privacyPolicy(),
    queryFn: async (): Promise<PrivacyPolicyMetadata> => {
      const { data } = await client.GET("/api/admin/privacy-policy")
      return data!
    },
  })

export const uploadPrivacyPolicyMutation = (queryClient: QueryClient) =>
  mutationOptions({
    mutationKey: [...queryKeys.privacyPolicy(), "upload"] as const,
    mutationFn: async (file: File): Promise<PrivacyPolicyMetadata> => {
      const formData = new FormData()
      formData.append("file", file)

      const { data } = await client.POST("/api/admin/privacy-policy", {
        body: formData as unknown as { file: string },
      })
      return data!
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
