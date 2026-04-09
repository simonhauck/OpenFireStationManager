import { createFileRoute } from "@tanstack/react-router"

import UsersManagementPage from "#/users/components/UsersManagementPage"

export const Route = createFileRoute("/user-management/")({
  component: UserManagementRoute,
})

function UserManagementRoute() {
  return <UsersManagementPage />
}
