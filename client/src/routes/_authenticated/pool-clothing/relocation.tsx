import { createFileRoute } from "@tanstack/react-router"
import RelocationPage from "#/clothing/relocation/components/RelocationPage"
import RoleGuard from "#/components/base/RoleGuard"

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
