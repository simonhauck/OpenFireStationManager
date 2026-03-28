import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/klamottenmanagement/")({
  component: KlamottenManagement,
})

function KlamottenManagement() {
  return <div>Hello "/kleidermanagement/"!</div>
}
