import { createFileRoute, Outlet } from "@tanstack/react-router"

import { meQuery } from "#/api/auth.queries"
import { redirectToLogin, useSessionRecheckOnVisible } from "#/api/session"

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async ({ context, location, preload }) => {
    const data = await context.queryClient.ensureQueryData(meQuery())
    if (!data.authenticated && !preload) {
      // A full-page navigation: the sign-in happens at the provider, not inside the app.
      await redirectToLogin(location.href)
    }
  },
  component: AuthenticatedLayout,
})

function AuthenticatedLayout() {
  useSessionRecheckOnVisible()
  return <Outlet />
}
