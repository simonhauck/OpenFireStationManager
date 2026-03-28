import { createFileRoute } from "@tanstack/react-router"

import UsersManagementPage from "#/users/components/UsersManagementPage"

export const Route = createFileRoute("/nutzermanagement/")({
  component: NutzermanagementRoute,
})

function NutzermanagementRoute() {
  return <UsersManagementPage />
}
