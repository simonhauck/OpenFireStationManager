import { queryOptions, useQuery } from "@tanstack/react-query"

import { client } from "#/api/client"
import { queryKeys } from "#/api/queryKeys"
import type { UserAccount } from "#/users/model/user"

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
