import { queryOptions, useQuery } from "@tanstack/react-query"

import { client } from "#/api/client"
import { queryKeys } from "#/api/queryKeys"
import type { components } from "#/api/schema"

type UserAccount = components["schemas"]["UserAccount"]

export function useUsers() {
  return useQuery(
    queryOptions({
      queryKey: queryKeys.users(),
      queryFn: async (): Promise<UserAccount[]> => {
        const { data } = await client.GET("/api/admin/users")

        if (!data) {
          return []
        }

        return data
      },
    }),
  )
}
