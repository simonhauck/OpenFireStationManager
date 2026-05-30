import { mutationOptions, queryOptions } from "@tanstack/react-query"
import type { QueryClient } from "@tanstack/react-query"

import { client } from "#/api/client"
import { queryKeys } from "#/api/queryKeys"
import type { components } from "#/api/schema"

export type PrivacyPolicyMetadata =
  components["schemas"]["PrivacyPolicyMetadata"]

const baseUrl = import.meta.env.VITE_API_BASE_URL ?? ""

export const privacyPolicyQuery = () =>
  queryOptions({
    queryKey: queryKeys.privacyPolicy(),
    queryFn: async (): Promise<PrivacyPolicyMetadata | null> => {
      // A 404 means no document has been uploaded yet, which is a valid empty
      // state rather than an error, so it is handled explicitly here instead of
      // going through the typed client's throw-on-error middleware.
      const response = await fetch(`${baseUrl}/api/admin/privacy-policy`, {
        credentials: "include",
      })

      if (response.status === 404) {
        return null
      }

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`)
      }

      return (await response.json()) as PrivacyPolicyMetadata
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
