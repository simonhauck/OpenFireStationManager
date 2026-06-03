import { mutationOptions } from "@tanstack/react-query"
import type { QueryClient } from "@tanstack/react-query"

import { client } from "#/api/client"
import { queryKeys } from "#/api/queryKeys"
import type { components } from "#/api/schema"

export type CheckoutRequest = components["schemas"]["CheckoutRequest"]
export type CheckoutResponse = components["schemas"]["CheckoutResponse"]

export {
  searchClothingItems,
  getItemByBarcode,
} from "#/clothing/checkout/service/checkoutQueries"

export const returnMutation = (queryClient: QueryClient) =>
  mutationOptions({
    mutationFn: async (body: CheckoutRequest): Promise<CheckoutResponse> => {
      const { data } = await client.POST("/api/clothing/checkouts", { body })
      return data!
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.clothingItems(),
      })
    },
  })
