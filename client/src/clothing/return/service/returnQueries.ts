import type { QueryClient } from "@tanstack/react-query"
import { mutationOptions } from "@tanstack/react-query"

import { client, ensureData } from "#/api/client"
import { queryKeys } from "#/api/queryKeys"
import type {
  CheckoutRequest,
  CheckoutResponse,
} from "#/clothing/model/checkout"

export {
  getItemByBarcode,
  searchClothingItems,
} from "#/clothing/checkout/service/checkoutQueries"

export const returnMutation = (queryClient: QueryClient) =>
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
