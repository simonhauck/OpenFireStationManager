import { mutationOptions } from "@tanstack/react-query"

import { client } from "#/api/client"
import type { components } from "#/api/schema"

export type ResolvedClothingItem = components["schemas"]["ResolvedClothingItem"]
export type CheckoutRequest = components["schemas"]["CheckoutRequest"]
export type CheckoutHttpResponse =
  | components["schemas"]["Ok"]
  | components["schemas"]["NeedsConfirmation"]

const ensureData = <T>(
  data: T | undefined,
  error: unknown,
  requestName: string,
): T => {
  if (error) throw error
  if (data === undefined) throw new Error(`${requestName} returned no data`)
  return data
}

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
    { params: { path: { barcode } } },
  )
  return ensureData(data, error, "GET /api/clothing/items/by-barcode/{barcode}")
}

export const checkoutMutation = () =>
  mutationOptions({
    mutationFn: async (
      body: CheckoutRequest,
    ): Promise<CheckoutHttpResponse> => {
      const { data, error } = await client.POST("/api/clothing/checkouts", {
        body,
      })
      return ensureData(data, error, "POST /api/clothing/checkouts")
    },
  })
