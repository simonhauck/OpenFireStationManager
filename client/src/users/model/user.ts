import type { components } from "#/api/schema"

export type UserAccount = components["schemas"]["UserAccount"]

export type UserRole = components["schemas"]["UserAccount"]["roles"][number]

export type CreateUserRequest = components["schemas"]["CreateUserRequest"]

export type UpdateUserRequest = components["schemas"]["UpdateUserRequest"]

export type ChangePasswordRequest =
  components["schemas"]["ChangePasswordRequest"]
