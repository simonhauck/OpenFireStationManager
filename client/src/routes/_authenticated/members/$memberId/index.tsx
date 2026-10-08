import { createFileRoute } from "@tanstack/react-router"

import MemberDetailPage from "#/members/components/detail/MemberDetailPage"

export const Route = createFileRoute("/_authenticated/members/$memberId/")({
  component: MemberDetailRoute,
})

function MemberDetailRoute() {
  return <MemberDetailPage />
}
