import { createFileRoute } from "@tanstack/react-router"

import AdminSettingsPage from "#/admin/components/AdminSettingsPage"

export const Route = createFileRoute("/_authenticated/admin/settings")({
  component: AdminSettingsRoute,
})

function AdminSettingsRoute() {
  return <AdminSettingsPage />
}
