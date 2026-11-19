import { useQuery } from "@tanstack/react-query"
import { createFileRoute, Outlet } from "@tanstack/react-router"

import { meQuery } from "#/api/auth.queries"
import { redirectToLogin, useSessionRecheckOnVisible } from "#/api/session"
import NoAccessPage from "#/components/NoAccessPage"

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
  const { data } = useQuery(meQuery())
  const user = data?.user

  // Signed in, but without any OFSM role: no child route may render (the API refuses them too).
  if (data?.authenticated && user && user.roles.length === 0) {
    const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ")
    return <NoAccessPage fullName={fullName || user.username} />
  }

  return <Outlet />
}
