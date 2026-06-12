import { queryOptions, mutationOptions } from "@tanstack/react-query"
import type { QueryClient } from "@tanstack/react-query"

import { client } from "#/api/client"
import { queryKeys } from "#/api/queryKeys"
import type {
  InventoryReconciliationPreviewRequest,
  InventoryReconciliationPreviewResponse,
  InventoryReconciliationExecuteResponse,
} from "#/clothing/model/inventoryReconciliation"

export function inventoryReconciliationPreviewQuery(
  locationId: number,
  request: InventoryReconciliationPreviewRequest,
) {
  return queryOptions({
    queryKey: [
      ...queryKeys.clothingItems(),
      "inventory-reconciliation-preview",
      locationId,
      request.scannedItemIds,
    ],
    queryFn: async (): Promise<InventoryReconciliationPreviewResponse> => {
      const { data } = await client.POST(
        "/api/clothing/inventory-reconciliation/{locationId}/preview",
        {
          params: { path: { locationId } },
          body: request,
        },
      )
      return data!
    },
  })
}

export const inventoryReconciliationExecuteMutation = (
  queryClient: QueryClient,
) =>
  mutationOptions({
    mutationFn: async ({
      locationId,
      body,
    }: {
      locationId: number
      body: InventoryReconciliationPreviewResponse
    }): Promise<InventoryReconciliationExecuteResponse> => {
      const { data } = await client.POST(
        "/api/clothing/inventory-reconciliation/{locationId}/execute",
        {
          params: { path: { locationId } },
          body,
        },
      )
      return data!
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.clothingItems(),
      })
    },
  })
