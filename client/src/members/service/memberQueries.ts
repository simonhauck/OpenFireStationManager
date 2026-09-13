import type { QueryClient } from "@tanstack/react-query"
import { mutationOptions, queryOptions, useQuery } from "@tanstack/react-query"

import { client, ensureData } from "#/api/client"
import { queryKeys } from "#/api/queryKeys"
import type {
  CreateOrUpdateMemberRequest,
  Member,
} from "#/members/model/member.ts"

type UpdateMemberVariables = {
  id: number
  body: CreateOrUpdateMemberRequest
}

export const getAllMembersQuery = () =>
  queryOptions({
    queryKey: queryKeys.members(),
    queryFn: async (): Promise<Member[]> => {
      const { data, error } = await client.GET("/api/members")
      return ensureData(data, error, "GET /api/members")
    },
  })

export const getMemberByIdQuery = (id: number) =>
  queryOptions({
    queryKey: queryKeys.member(id),
    queryFn: async (): Promise<Member> => {
      const { data, error } = await client.GET("/api/members/{id}", {
        params: { path: { id } },
      })
      return ensureData(data, error, "GET /api/members/{id}")
    },
  })

export const createMemberMutation = (queryClient: QueryClient) =>
  mutationOptions({
    mutationKey: [...queryKeys.members(), "create"] as const,
    mutationFn: async (body: CreateOrUpdateMemberRequest): Promise<Member> => {
      const { data, error } = await client.POST("/api/members", { body })
      return ensureData(data, error, "POST /api/members")
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.members(),
      })
    },
  })

export const updateMemberMutation = (queryClient: QueryClient) =>
  mutationOptions({
    mutationKey: [...queryKeys.members(), "update"] as const,
    mutationFn: async (variables: UpdateMemberVariables): Promise<Member> => {
      const { data, error } = await client.PATCH("/api/members/{id}", {
        params: { path: { id: variables.id } },
        body: variables.body,
      })
      return ensureData(data, error, "PATCH /api/members/{id}")
    },
    onSuccess: async (_, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: queryKeys.members(),
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.member(variables.id),
        }),
      ])
    },
  })

export function useMembers() {
  return useQuery(getAllMembersQuery())
}

export function useMemberById(id: number) {
  return useQuery({
    ...getMemberByIdQuery(id),
    enabled: Number.isFinite(id),
  })
}
