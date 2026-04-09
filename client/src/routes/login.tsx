import { useMutation, useQueryClient } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useState } from "react"

import { loginMutation } from "#/api/auth.queries"
import { Button } from "#/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "#/components/ui/card"
import { Input } from "#/components/ui/input"
import { Label } from "#/components/ui/label"

export const Route = createFileRoute("/login")({
  component: Login,
})

function Login() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")

  const {
    mutate: login,
    isPending,
    error,
  } = useMutation(loginMutation(queryClient))

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    login(
      { username, password },
      {
        onSuccess: () => {
          void navigate({ to: "/" })
        },
      },
    )
  }

  return (
    <main className="page-wrap flex min-h-[calc(100vh-4rem)] items-center px-4 py-12">
      <Card className="mx-auto w-full max-w-sm">
        <CardHeader>
          <CardTitle>Anmelden</CardTitle>
          <CardDescription>
            Geben Sie Ihre Zugangsdaten ein, um fortzufahren.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="username">Benutzername</Label>
              <Input
                id="username"
                type="text"
                autoComplete="username"
                placeholder="benutzername"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password">Passwort</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {error && (
              <p className="text-sm text-destructive">
                Anmeldung fehlgeschlagen. Bitte überprüfen Sie Ihre
                Zugangsdaten.
              </p>
            )}

            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? "Anmelden …" : "Anmelden"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
