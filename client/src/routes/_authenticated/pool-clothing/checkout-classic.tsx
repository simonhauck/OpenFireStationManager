import { createFileRoute } from "@tanstack/react-router"
import CheckoutClassicPage from "#/clothing/checkout/classic/CheckoutClassicPage"
import RoleGuard from "#/components/base/RoleGuard"

export const Route = createFileRoute(
  "/_authenticated/pool-clothing/checkout-classic",
)({
  component: CheckoutClassicRoute,
})

function CheckoutClassicRoute() {
  return (
    <RoleGuard allowedRoles={["USER"]}>
      <CheckoutClassicPage />
    </RoleGuard>
  )
}
