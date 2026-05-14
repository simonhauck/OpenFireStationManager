import { mutationOptions } from "@tanstack/react-query"
import type { QueryClient } from "@tanstack/react-query"

import { client } from "#/api/client"
import { queryKeys } from "#/api/queryKeys"
import type { components } from "#/api/schema"

export type ResolvedClothingItem = components["schemas"]["ResolvedClothingItem"]
export type CheckoutRequest = components["schemas"]["CheckoutRequest"]

/**
 * Runtime-accurate discriminated union for the checkout response.
 *
 * The generated schema uses capitalised status literals ("Ok", "NeedsConfirmation")
 * but the server actually sends lowercase snake_case values at runtime.
 * This type reflects what the wire actually carries.
 */
export type CheckoutHttpResponse =
  | { status: "ok"; batchId: string }
  | {
      status: "needs_confirmation"
      discrepancies: components["schemas"]["Discrepancy"][]
    }

export async function searchClothingItems(
  q: string,
  limit = 50,
): Promise<ResolvedClothingItem[]> {
  const { data } = await client.GET("/api/clothing/items/search", {
    params: { query: { q, limit } },
  })
  return data!
}

export async function getItemByBarcode(
  barcode: string,
): Promise<ResolvedClothingItem> {
  const { data } = await client.GET(
    "/api/clothing/items/by-barcode/{barcode}",
    {
      params: { path: { barcode } },
    },
  )
  return data!
}

export const checkoutMutation = (queryClient: QueryClient) =>
  mutationOptions({
    mutationFn: async (
      body: CheckoutRequest,
    ): Promise<CheckoutHttpResponse> => {
      const { data } = await client.POST("/api/clothing/checkouts", { body })
      return data as unknown as CheckoutHttpResponse
    },
    onSuccess: async () => {
      // clothingItems() is the prefix for all item-derived views (overview,
      // summary), so a single invalidation covers everything.
      await queryClient.invalidateQueries({
        queryKey: queryKeys.clothingItems(),
      })
    },
  })
