import { mutationOptions, queryOptions } from "@tanstack/react-query"
import type { QueryClient } from "@tanstack/react-query"
import { client } from "#/api/client"
import { queryKeys } from "#/api/queryKeys"
import type { AuthStateResponse, LoginRequest } from "#/api/model/auth"

export const meQuery = () =>
  queryOptions({
    queryKey: queryKeys.me(),
    queryFn: async (): Promise<AuthStateResponse> => {
      const { data } = await client.GET("/api/public/auth/me")
      return data!
    },
  })

export const logoutMutation = (queryClient: QueryClient) =>
  mutationOptions({
    mutationFn: async (): Promise<void> => {
      await client.POST("/api/public/auth/logout")
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries()
      await queryClient.resetQueries()
    },
  })

export const loginMutation = (queryClient: QueryClient) =>
  mutationOptions({
    mutationFn: async (body: LoginRequest): Promise<void> => {
      await client.POST("/api/public/auth/login", { body })
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.me() })
    },
  })
