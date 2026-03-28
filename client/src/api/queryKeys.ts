export const queryKeys = {
  users: () => ["users"] as const,
  user: (id: number) => ["users", id] as const,
  clothingTypes: () => ["clothing", "types"] as const,
  me: () => ["auth", "me"] as const,
}
