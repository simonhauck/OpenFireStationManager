import { Button } from "@astryxdesign/core/Button"
import { Card } from "@astryxdesign/core/Card"
import { Heading } from "@astryxdesign/core/Heading"
import { Text } from "@astryxdesign/core/Text"
import { createFileRoute, redirect } from "@tanstack/react-router"

import { meQuery } from "#/api/auth.queries"
import { loginUrl } from "#/api/auth.utils"
import { redirectToLogin } from "#/api/session"

interface LoginSearch {
  redirect?: string
  error?: boolean
}

/**
 * Sign-in happens at the OpenID Connect provider. Without `?error` this route forwards straight
 * to the server's login entry point; with `?error` (a failed or cancelled sign-in) it explains
 * what happened and offers to try again.
 */
export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>): LoginSearch => ({
    redirect: typeof search.redirect === "string" ? search.redirect : undefined,
    error: search.error !== undefined ? true : undefined,
  }),
  beforeLoad: async ({ context, search, preload }) => {
    if (search.error || preload) return

    const data = await context.queryClient.ensureQueryData(meQuery())
    if (data.authenticated) {
      throw redirect({ to: "/dashboard" })
    }
    await redirectToLogin(search.redirect ?? "/dashboard")
  },
  component: Login,
})

function Login() {
  const { redirect: redirectTo } = Route.useSearch()

  return (
    <div className="flex items-center">
      <Card maxWidth={512} className="mx-auto w-full">
        <div className="flex flex-col gap-4">
          <div>
            <Heading level={1}>Anmeldung fehlgeschlagen</Heading>
            <Text type="supporting" as="p" className="mt-1">
              Die Anmeldung wurde abgebrochen oder ist fehlgeschlagen. Bitte
              versuchen Sie es erneut.
            </Text>
          </div>

          <Button
            label="Erneut anmelden"
            variant="primary"
            width="100%"
            href={loginUrl(redirectTo ?? "/dashboard")}
          />
        </div>
      </Card>
    </div>
  )
}
