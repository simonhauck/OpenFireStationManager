import { createFileRoute } from "@tanstack/react-router"
import { requireFreshSession } from "#/api/session"
import CheckoutPage from "#/clothing/checkout/combined/CheckoutPage"
import RoleGuard from "#/components/base/RoleGuard"

export const Route = createFileRoute("/_authenticated/pool-clothing/checkout")({
  beforeLoad: requireFreshSession,
  component: CheckoutRoute,
})

function CheckoutRoute() {
  return (
    <RoleGuard allowedRoles={["USER"]}>
      <CheckoutPage />
    </RoleGuard>
  )
}
