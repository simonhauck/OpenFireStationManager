import { createFileRoute, Outlet, redirect } from "@tanstack/react-router"

import { meQuery } from "#/api/auth.queries"

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async ({ context, location }) => {
    const data = await context.queryClient.ensureQueryData(meQuery())
    if (!data.authenticated) {
      throw redirect({
        to: "/login",
        search: { redirect: location.href },
      })
    }
  },
  component: () => <Outlet />,
})
