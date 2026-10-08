import { Button } from "@astryxdesign/core/Button"
import { Card } from "@astryxdesign/core/Card"
import { CheckboxInput } from "@astryxdesign/core/CheckboxInput"
import { Heading } from "@astryxdesign/core/Heading"
import { Text } from "@astryxdesign/core/Text"
import { TextInput } from "@astryxdesign/core/TextInput"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router"
import { useState } from "react"

import { loginMutation, meQuery } from "#/api/auth.queries"

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: typeof search.redirect === "string" ? search.redirect : undefined,
  }),
  beforeLoad: async ({ context }) => {
    const data = await context.queryClient.ensureQueryData(meQuery())
    if (data.authenticated) {
      throw redirect({ to: "/dashboard" })
    }
  },
  component: Login,
})

function Login() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { redirect: redirectTo } = Route.useSearch()

  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(false)

  const {
    mutate: login,
    isPending,
    error,
  } = useMutation(loginMutation(queryClient))

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    login(
      { username, password, rememberMe },
      {
        onSuccess: () => {
          if (redirectTo) {
            void navigate({ to: redirectTo, replace: true })
          } else {
            void navigate({ to: "/dashboard", replace: true })
          }
        },
      },
    )
  }

  return (
    <div className="flex items-center">
      <Card maxWidth={512} className="mx-auto w-full">
        <div className="flex flex-col gap-4">
          <div>
            <Heading level={1}>Anmelden</Heading>
            <Text type="supporting" as="p" className="mt-1">
              Geben Sie Ihre Zugangsdaten ein, um fortzufahren.
            </Text>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <TextInput
              label="Benutzername"
              type="text"
              autoComplete="username"
              placeholder="benutzername"
              isRequired
              value={username}
              onChange={setUsername}
            />

            <TextInput
              label="Passwort"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              isRequired
              value={password}
              onChange={setPassword}
            />

            <CheckboxInput
              label="Angemeldet bleiben"
              value={rememberMe}
              onChange={setRememberMe}
            />

            {error && (
              <p className="text-destructive text-sm">
                Anmeldung fehlgeschlagen. Bitte überprüfen Sie Ihre
                Zugangsdaten.
              </p>
            )}

            <Button
              type="submit"
              label="Anmelden"
              variant="primary"
              width="100%"
              isLoading={isPending}
            />
          </form>
        </div>
      </Card>
    </div>
  )
}
