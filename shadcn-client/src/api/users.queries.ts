import { mutationOptions, queryOptions } from "@tanstack/react-query"
import type { QueryClient } from "@tanstack/react-query"
import { client } from "#/api/client"
import { queryKeys } from "#/api/queryKeys"
import type { components } from "#/api/schema"

type CreateUserRequest = components["schemas"]["CreateUserRequest"]
type UpdateUserRequest = components["schemas"]["UpdateUserRequest"]
type ChangePasswordRequest = components["schemas"]["ChangePasswordRequest"]
type UserAccount = components["schemas"]["UserAccount"]

type UpdateUserVariables = {
  id: number
  body: UpdateUserRequest
}

type ChangePasswordVariables = {
  id: number
  body: ChangePasswordRequest
}

const ensureData = <T>(
  data: T | undefined,
  error: unknown,
  requestName: string,
): T => {
  if (error) {
    throw error
  }

  if (data === undefined) {
    throw new Error(`${requestName} returned no data`)
  }

  return data
}

export const getAllUsersQuery = () =>
  queryOptions({
    queryKey: queryKeys.users(),
    queryFn: async (): Promise<UserAccount[]> => {
      const { data, error } = await client.GET("/api/admin/users")
      return ensureData(data, error, "GET /api/admin/users")
    },
  })

export const getUserByIdQuery = (id: number) =>
  queryOptions({
    queryKey: queryKeys.user(id),
    queryFn: async (): Promise<UserAccount> => {
      const { data, error } = await client.GET("/api/admin/users/{id}", {
        params: {
          path: { id },
        },
      })

      return ensureData(data, error, "GET /api/admin/users/{id}")
    },
  })

export const createUserMutation = (queryClient: QueryClient) =>
  mutationOptions({
    mutationKey: [...queryKeys.users(), "create"] as const,
    mutationFn: async (body: CreateUserRequest): Promise<UserAccount> => {
      const { data, error } = await client.POST("/api/admin/users", {
        body,
      })

      return ensureData(data, error, "POST /api/admin/users")
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.users() })
    },
  })

export const updateUserMutation = (queryClient: QueryClient) =>
  mutationOptions({
    mutationKey: [...queryKeys.users(), "update"] as const,
    mutationFn: async (
      variables: UpdateUserVariables,
    ): Promise<UserAccount> => {
      const { data, error } = await client.PATCH("/api/admin/users/{id}", {
        params: {
          path: { id: variables.id },
        },
        body: variables.body,
      })

      return ensureData(data, error, "PATCH /api/admin/users/{id}")
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.users() }),
        queryClient.invalidateQueries({ queryKey: queryKeys.me() }),
      ])
    },
  })

export const changePasswordMutation = (queryClient: QueryClient) =>
  mutationOptions({
    mutationKey: [...queryKeys.users(), "changePassword"] as const,
    mutationFn: async (
      variables: ChangePasswordVariables,
    ): Promise<UserAccount> => {
      const { data, error } = await client.PUT(
        "/api/admin/users/{id}/password",
        {
          params: {
            path: { id: variables.id },
          },
          body: variables.body,
        },
      )

      return ensureData(data, error, "PUT /api/admin/users/{id}/password")
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.users() })
    },
  })
