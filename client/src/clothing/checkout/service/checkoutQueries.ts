import type { QueryClient } from "@tanstack/react-query"
import { mutationOptions } from "@tanstack/react-query"

import { client, ensureData } from "#/api/client"
import { queryKeys } from "#/api/queryKeys"
import type {
  CheckoutRequest,
  CheckoutResponse,
} from "#/clothing/model/checkout"
import type { ResolvedClothingItem } from "#/clothing/model/clothingItems.ts"

export async function searchClothingItems(
  q: string,
  limit = 50,
): Promise<ResolvedClothingItem[]> {
  const { data, error } = await client.GET("/api/clothing/items/search", {
    params: { query: { q, limit } },
  })
  return ensureData(data, error, "GET /api/clothing/items/search")
}

export async function getItemByBarcode(
  barcode: string,
): Promise<ResolvedClothingItem> {
  const { data, error } = await client.GET(
    "/api/clothing/items/by-barcode/{barcode}",
    {
      params: { path: { barcode } },
    },
  )
  return ensureData(data, error, "GET /api/clothing/items/by-barcode/{barcode}")
}

export const checkoutMutation = (queryClient: QueryClient) =>
  mutationOptions({
    mutationFn: async (body: CheckoutRequest): Promise<CheckoutResponse> => {
      const { data, error } = await client.POST("/api/clothing/checkouts", {
        body,
      })
      return ensureData(data, error, "POST /api/clothing/checkouts")
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.clothingItems(),
      })
    },
  })
