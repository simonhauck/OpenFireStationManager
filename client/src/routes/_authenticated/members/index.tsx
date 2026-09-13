import { createFileRoute } from "@tanstack/react-router"

import MembersPage from "#/members/components/list/MembersPage"

export const Route = createFileRoute("/_authenticated/members/")({
  component: MembersRoute,
})

function MembersRoute() {
  return <MembersPage />
}
