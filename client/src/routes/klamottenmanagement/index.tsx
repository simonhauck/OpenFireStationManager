import { Navigate, createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/klamottenmanagement/")({
  component: KlamottenManagementIndexRoute,
})

function KlamottenManagementIndexRoute() {
  return <Navigate to="/klamottenmanagement/types" />
}
