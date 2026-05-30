import { createFileRoute } from "@tanstack/react-router"

import AdminSettingsPage from "#/admin/components/AdminSettingsPage"

export const Route = createFileRoute("/admin/settings")({
  component: AdminSettingsRoute,
})

function AdminSettingsRoute() {
  return <AdminSettingsPage />
}
