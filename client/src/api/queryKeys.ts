/**
 * Centralised query key factory.
 *
 * Key hierarchy (TanStack Query uses prefix matching for invalidation):
 *
 *   ["clothing", "types"]            – all clothing types
 *   ["clothing", "types", id]        – single type by id
 *
 *   ["clothing", "items"]            – all clothing items *and* every derived
 *   ["clothing", "items", id]          aggregate/overview that changes whenever
 *   ["clothing", "items", "overview"]  items move (checkout, relocation, CRUD).
 *   ["clothing", "items", "summary"]   Invalidating clothingItems() therefore
 *                                      automatically covers overview + summary.
 *
 *   ["clothing", "locations"]        – all clothing locations
 *   ["clothing", "locations", id]    – single location by id
 */
export const queryKeys = {
  users: () => ["users"] as const,
  user: (id: number) => ["users", id] as const,

  // Clothing types and their derived summary
  clothingTypes: () => ["clothing", "types"] as const,
  clothingType: (id: number) => ["clothing", "types", id] as const,

  // Clothing items and every view derived from them
  clothingItems: () => ["clothing", "items"] as const,
  clothingItem: (id: number) => ["clothing", "items", id] as const,
  /** Dashboard: items grouped by location. Nested under clothingItems so that
   *  any operation that changes items (checkout, relocation, CRUD) automatically
   *  invalidates this view by invalidating clothingItems(). */
  clothingOverview: () => ["clothing", "items", "overview"] as const,
  /** Summary: item counts grouped by type/size. Nested under clothingItems for
   *  the same reason as clothingOverview. */
  clothingTypeSizeSummary: () => ["clothing", "items", "summary"] as const,

  // Clothing locations
  clothingLocations: () => ["clothing", "locations"] as const,
  clothingLocation: (id: number) => ["clothing", "locations", id] as const,

  me: () => ["auth", "me"] as const,
}
