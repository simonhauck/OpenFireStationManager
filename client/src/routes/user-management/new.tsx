import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router"
import { useState } from "react"

import { createUserMutation } from "#/api/users.queries"
import ErrorState from "#/components/base/ErrorState"
import RoleGuard from "#/components/base/RoleGuard"
import { Button } from "#/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "#/components/ui/card"
import { Checkbox } from "#/components/ui/checkbox"
import { Input } from "#/components/ui/input"
import { Label } from "#/components/ui/label"
import { ROLE_OPTIONS } from "#/users/roleMetadata"
import type { UserRole } from "#/users/roleMetadata"

export const Route = createFileRoute("/user-management/new")({
  component: CreateUserPage,
})

function CreateUserPage() {
  return (
    <RoleGuard allowedRoles={["ADMIN"]}>
      <CreateUserPageContent />
    </RoleGuard>
  )
}

function CreateUserPageContent() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [roles, setRoles] = useState<UserRole[]>(["USER"])
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [rolesError, setRolesError] = useState<string | null>(null)

  const {
    mutate: createUser,
    isPending,
    error,
  } = useMutation(createUserMutation(queryClient))

  function toggleRole(role: UserRole, checked: boolean) {
    setRolesError(null)
    setRoles((prevRoles) => {
      if (checked) {
        if (prevRoles.includes(role)) {
          return prevRoles
        }
        return [...prevRoles, role]
      }

      return prevRoles.filter((existingRole) => existingRole !== role)
    })
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setPasswordError(null)

    if (roles.length === 0) {
      setRolesError("Bitte wählen Sie mindestens eine Rolle aus.")
      return
    }

    if (password !== confirmPassword) {
      setPasswordError(
        "Passwort und Passwortbestätigung stimmen nicht überein.",
      )
      return
    }

    createUser(
      {
        username,
        password,
        firstName,
        lastName,
        roles,
      },
      {
        onSuccess: () => {
          void navigate({ to: "/user-management" })
        },
      },
    )
  }

  return (
    <main className="page-wrap px-4 py-12">
      <Card className="mx-auto w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Nutzer erstellen</CardTitle>
          <CardDescription>
            Erfassen Sie die Daten für ein neues Nutzerkonto.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="username">Benutzername</Label>
              <Input
                id="username"
                autoComplete="username"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Passwort</Label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  setPasswordError(null)
                }}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirm-password">Passwort bestätigen</Label>
              <Input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value)
                  setPasswordError(null)
                }}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="first-name">Vorname</Label>
              <Input
                id="first-name"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="last-name">Nachname</Label>
              <Input
                id="last-name"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Rollen</Label>
              <div className="space-y-2 rounded-md border p-3">
                {ROLE_OPTIONS.map((roleOption) => {
                  const checkboxId = `role-${roleOption.value.toLowerCase()}`
                  const checked = roles.includes(roleOption.value)

                  return (
                    <div
                      key={roleOption.value}
                      className="flex items-start gap-3"
                    >
                      <Checkbox
                        id={checkboxId}
                        checked={checked}
                        onCheckedChange={(nextChecked) =>
                          toggleRole(roleOption.value, nextChecked === true)
                        }
                      />
                      <div className="space-y-0.5">
                        <Label htmlFor={checkboxId} className="cursor-pointer">
                          {roleOption.label}
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          {roleOption.description}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {passwordError && <ErrorState message={passwordError} />}

            {rolesError && <ErrorState message={rolesError} />}

            {error && (
              <ErrorState message="Der Nutzer konnte nicht erstellt werden." />
            )}

            <div className="flex flex-wrap justify-end gap-2 pt-2">
              <Button type="button" variant="outline" asChild>
                <Link to="/user-management">Abbrechen</Link>
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Wird erstellt..." : "Nutzer erstellen"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
