import { createFileRoute } from "@tanstack/react-router"
import Dashboard from "#/dashboard/components/Dashboard"

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
})
