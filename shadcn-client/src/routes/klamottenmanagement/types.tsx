import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/klamottenmanagement/types')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/klamottenmanagement/types"!</div>
}
