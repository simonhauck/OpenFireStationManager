import { createFileRoute } from "@tanstack/react-router"

import EditMemberPage from "#/members/components/edit/EditMemberPage"

export const Route = createFileRoute("/_authenticated/members/$memberId/edit")({
  component: EditMemberRoute,
})

function EditMemberRoute() {
  return <EditMemberPage />
}
