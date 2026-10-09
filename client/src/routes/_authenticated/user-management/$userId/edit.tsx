import { Button } from "@astryxdesign/core/Button"
import { Card } from "@astryxdesign/core/Card"
import { CheckboxList, CheckboxListItem } from "@astryxdesign/core/CheckboxList"
import { TextInput } from "@astryxdesign/core/TextInput"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import type React from "react"
import { useEffect, useState } from "react"

import { getUserByIdQuery, updateUserMutation } from "#/api/users.queries"
import ErrorState from "#/components/base/ErrorState"
import LoadingIndicator from "#/components/base/LoadingIndicator"
import PageSection from "#/components/base/PageSection"
import RoleGuard from "#/components/base/RoleGuard"
import type { UserRole } from "#/users/model/user.ts"
import { ROLE_OPTIONS } from "#/users/roleMetadata"

export const Route = createFileRoute(
  "/_authenticated/user-management/$userId/edit",
)({
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
    <PageSection
      title="Nutzer bearbeiten"
      subtitle={`Vorname, Nachname und Rollen von ${user.username} bearbeiten.`}
    >
      <Card maxWidth={672} className="mx-auto w-full">
        <form onSubmit={handleSubmit} className="space-y-4">
          <TextInput
            label="Benutzername"
            value={user.username}
            isDisabled
            isReadOnly
          />

          <TextInput
            label="Vorname"
            isRequired
            value={firstName}
            onChange={setFirstName}
          />

          <TextInput
            label="Nachname"
            isRequired
            value={lastName}
            onChange={setLastName}
          />

          <CheckboxList
            label="Rollen"
            value={roles}
            onChange={(values) => {
              setRolesError(null)
              setRoles(values as UserRole[])
            }}
            hasDividers
            status={
              rolesError ? { type: "error", message: rolesError } : undefined
            }
          >
            {ROLE_OPTIONS.map((roleOption) => (
              <CheckboxListItem
                key={roleOption.value}
                value={roleOption.value}
                label={roleOption.label}
                description={roleOption.description}
              />
            ))}
          </CheckboxList>

          {error && (
            <ErrorState message="Der Nutzer konnte nicht aktualisiert werden." />
          )}

          <div className="flex flex-wrap justify-end gap-2 pt-2">
            <Button
              label="Abbrechen"
              variant="secondary"
              href="/user-management"
            />
            <Button
              type="submit"
              label="Änderungen speichern"
              variant="primary"
              isLoading={isPending}
            />
          </div>
        </form>
      </Card>
    </PageSection>
  )
}
