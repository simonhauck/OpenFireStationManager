import { createFileRoute } from "@tanstack/react-router"

import UsersManagementPage from "#/users/components/UsersManagementPage"

export const Route = createFileRoute("/_authenticated/user-management/")({
  component: UserManagementRoute,
})

function UserManagementRoute() {
  return <UsersManagementPage />
}
