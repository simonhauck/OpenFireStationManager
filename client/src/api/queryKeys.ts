export const queryKeys = {
  users: () => ["users"] as const,
  user: (id: number) => ["users", id] as const,
  clothingTypes: () => ["clothing", "types"] as const,
  clothingType: (id: number) => ["clothing", "types", id] as const,
  clothingItems: () => ["clothing", "items"] as const,
  clothingItem: (id: number) => ["clothing", "items", id] as const,
  clothingOverview: () => ["clothing", "items", "overview"] as const,
  clothingTypeSizeSummary: () => ["clothing", "items", "summary"] as const,
  clothingLocations: () => ["clothing", "locations"] as const,
  clothingLocation: (id: number) => ["clothing", "locations", id] as const,
  me: () => ["auth", "me"] as const,
}
