import { createFileRoute } from "@tanstack/react-router"

import RoleGuard from "#/components/base/RoleGuard"
import RelocationPage from "#/clothing/relocation/components/RelocationPage"

export const Route = createFileRoute(
  "/_authenticated/pool-clothing/relocation",
)({
  component: RelocationRoute,
})

function RelocationRoute() {
  return (
    <RoleGuard allowedRoles={["KLEIDERWART"]}>
      <RelocationPage />
    </RoleGuard>
  )
}
