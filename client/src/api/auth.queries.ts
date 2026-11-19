import type { QueryClient } from "@tanstack/react-query"
import { queryOptions } from "@tanstack/react-query"
import { client, ensureData } from "#/api/client"
import type { AuthStateResponse } from "#/api/model/auth"
import { queryKeys } from "#/api/queryKeys"

export const meQuery = () =>
  queryOptions({
    queryKey: queryKeys.me(),
    queryFn: async (): Promise<AuthStateResponse> => {
      const { data, error } = await client.GET("/api/public/auth/me")
      return ensureData(data, error, "GET /api/public/auth/me")
    },
  })

/**
 * Asks the server for the current session state, ignoring any cached answer. Use it before work
 * starts that must not fail halfway because the session expired in the meantime.
 */
export function fetchFreshSession(
  queryClient: QueryClient,
): Promise<AuthStateResponse> {
  return queryClient.fetchQuery({ ...meQuery(), staleTime: 0 })
}
