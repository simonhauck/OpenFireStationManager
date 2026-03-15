export const queryKeys = {
  users: () => ["users"] as const,
  me: () => ["auth", "me"] as const,
}
