import { createFileRoute } from "@tanstack/react-router"

import RoleGuard from "#/components/base/RoleGuard"
import InventoryReconciliationPage from "#/clothing/inventory-reconciliation/components/InventoryReconciliationPage"

export const Route = createFileRoute(
  "/_authenticated/pool-clothing/inventory-reconciliation",
)({
  component: InventoryReconciliationRoute,
})

function InventoryReconciliationRoute() {
  return (
    <RoleGuard allowedRoles={["KLEIDERWART"]}>
      <InventoryReconciliationPage />
    </RoleGuard>
  )
}
