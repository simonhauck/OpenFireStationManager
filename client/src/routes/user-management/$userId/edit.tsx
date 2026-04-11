import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router"
import { useEffect, useState } from "react"

import { getUserByIdQuery, updateUserMutation } from "#/api/users.queries"
import ErrorState from "#/components/base/ErrorState"
import LoadingIndicator from "#/components/base/LoadingIndicator"
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

export const Route = createFileRoute("/user-management/$userId/edit")({
  component: EditUserPage,
})

function EditUserPage() {
  return (
    <RoleGuard allowedRoles={["ADMIN"]}>
      <EditUserPageContent />
    </RoleGuard>
  )
}

function EditUserPageContent() {
  const { userId } = Route.useParams()
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const numericUserId = Number(userId)
  const {
    data: user,
    isLoading,
    isError,
  } = useQuery({
    ...getUserByIdQuery(numericUserId),
    enabled: Number.isFinite(numericUserId),
  })

  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [roles, setRoles] = useState<UserRole[]>([])
  const [rolesError, setRolesError] = useState<string | null>(null)

  const {
    mutate: updateUser,
    isPending,
    error,
  } = useMutation(updateUserMutation(queryClient))

  useEffect(() => {
    if (!user) {
      return
    }

    setFirstName(user.firstName)
    setLastName(user.lastName)
    setRoles(user.roles)
  }, [user])

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

    if (roles.length === 0) {
      setRolesError("Bitte wählen Sie mindestens eine Rolle aus.")
      return
    }

    updateUser(
      {
        id: numericUserId,
        body: {
          firstName,
          lastName,
          roles,
        },
      },
      {
        onSuccess: () => {
          void navigate({ to: "/user-management" })
        },
      },
    )
  }

  if (!Number.isFinite(numericUserId)) {
    return <ErrorState message="Ungültige Nutzer-ID." />
  }

  if (isLoading) {
    return <LoadingIndicator label="Nutzerdaten werden geladen..." />
  }

  if (isError || !user) {
    return <ErrorState message="Nutzerdaten konnten nicht geladen werden." />
  }

  return (
    <Card className="mx-auto w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Nutzer bearbeiten</CardTitle>
        <CardDescription>
          Bearbeiten Sie Vorname, Nachname und Rollen des Nutzers.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="username">Benutzername</Label>
            <Input id="username" value={user.username} disabled readOnly />
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

          {rolesError && <ErrorState message={rolesError} />}

          {error && (
            <ErrorState message="Der Nutzer konnte nicht aktualisiert werden." />
          )}

          <div className="flex flex-wrap justify-end gap-2 pt-2">
            <Button type="button" variant="outline" asChild>
              <Link to="/user-management">Abbrechen</Link>
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Wird gespeichert..." : "Änderungen speichern"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
