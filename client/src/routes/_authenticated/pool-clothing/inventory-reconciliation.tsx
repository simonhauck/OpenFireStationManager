import { createFileRoute } from "@tanstack/react-router"
import InventoryReconciliationPage from "#/clothing/inventory-reconciliation/components/InventoryReconciliationPage"
import RoleGuard from "#/components/base/RoleGuard"

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
