import { createFileRoute } from "@tanstack/react-router"

import CreateMemberPage from "#/members/components/create/CreateMemberPage"

export const Route = createFileRoute("/_authenticated/members/new")({
  component: CreateMemberRoute,
})

function CreateMemberRoute() {
  return <CreateMemberPage />
}
