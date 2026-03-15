import { mutationOptions, queryOptions } from "@tanstack/react-query"
import type { QueryClient } from "@tanstack/react-query"
import { client } from "#/api/client"
import { queryKeys } from "#/api/queryKeys"
import type { components } from "#/api/schema"

type AuthStateResponse = components["schemas"]["AuthStateResponse"]
type LoginRequest = components["schemas"]["LoginRequest"]

const ensureData = <T>(data: T | undefined, error: unknown): T => {
  if (error) {
    throw error
  }

  if (data === undefined) {
    throw new Error("GET /api/public/auth/me returned no data")
  }

  return data
}

export const meQuery = () =>
  queryOptions({
    queryKey: queryKeys.me(),
    queryFn: async (): Promise<AuthStateResponse> => {
      const { data, error } = await client.GET("/api/public/auth/me")
      return ensureData(data, error)
    },
  })

export const logoutMutation = (queryClient: QueryClient) =>
  mutationOptions({
    mutationFn: async (): Promise<void> => {
      const { error } = await client.POST("/api/public/auth/logout")
      if (error) throw error
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.me() })
    },
  })

export const loginMutation = (queryClient: QueryClient) =>
  mutationOptions({
    mutationFn: async (body: LoginRequest): Promise<void> => {
      const { error } = await client.POST("/api/public/auth/login", { body })
      if (error) throw error
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.me() })
    },
  })
