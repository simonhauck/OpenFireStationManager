import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/klamottenmanagement/items/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/klamottenmanagement/items/"!</div>
}
