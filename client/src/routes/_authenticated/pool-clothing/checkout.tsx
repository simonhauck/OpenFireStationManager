import { createFileRoute } from "@tanstack/react-router"

import RoleGuard from "#/components/base/RoleGuard"
import CheckoutPage from "#/clothing/checkout/components/CheckoutPage"

export const Route = createFileRoute("/_authenticated/pool-clothing/checkout")({
  component: CheckoutRoute,
})

function CheckoutRoute() {
  return (
    <RoleGuard allowedRoles={["USER"]}>
      <CheckoutPage />
    </RoleGuard>
  )
}
