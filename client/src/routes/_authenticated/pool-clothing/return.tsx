import { createFileRoute } from "@tanstack/react-router"

import RoleGuard from "#/components/base/RoleGuard"
import ReturnPage from "#/clothing/return/components/ReturnPage"

export const Route = createFileRoute("/_authenticated/pool-clothing/return")({
  component: ReturnRoute,
  validateSearch: (
    search: Record<string, unknown>,
  ): { returnTarget: string } => ({
    returnTarget: (search.returnTarget as string) || "WAESCHE",
  }),
})

function ReturnRoute() {
  return (
    <RoleGuard allowedRoles={["USER"]}>
      <ReturnPage />
    </RoleGuard>
  )
}
