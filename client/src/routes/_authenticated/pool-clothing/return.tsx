import { createFileRoute } from "@tanstack/react-router"

import RoleGuard from "#/components/base/RoleGuard"
import ReturnPage from "#/clothing/return/components/ReturnPage"

export const Route = createFileRoute("/_authenticated/pool-clothing/return")({
  component: ReturnRoute,
  validateSearch: (
    search: Record<string, unknown>,
  ): { returnTarget: "WAESCHE" | "POOL" } => ({
    returnTarget:
      (search.returnTarget as "WAESCHE" | "POOL" | undefined) ?? "WAESCHE",
  }),
})

function ReturnRoute() {
  const { returnTarget } = Route.useSearch()
  return (
    <RoleGuard allowedRoles={["USER"]}>
      <ReturnPage returnTarget={returnTarget} />
    </RoleGuard>
  )
}
