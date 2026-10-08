import { Button } from "@astryxdesign/core/Button"
import { Card } from "@astryxdesign/core/Card"
import { CheckboxList, CheckboxListItem } from "@astryxdesign/core/CheckboxList"
import { TextInput } from "@astryxdesign/core/TextInput"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import type React from "react"
import { useState } from "react"

import { createUserMutation } from "#/api/users.queries"
import ErrorState from "#/components/base/ErrorState"
import PageSection from "#/components/base/PageSection"
import RoleGuard from "#/components/base/RoleGuard"
import type { UserRole } from "#/users/model/user.ts"
import { ROLE_OPTIONS } from "#/users/roleMetadata"

export const Route = createFileRoute("/_authenticated/user-management/new")({
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
    <PageSection
      title="Nutzer erstellen"
      subtitle="Erfassen Sie die Daten für ein neues Nutzerkonto."
    >
      <Card maxWidth={672} className="mx-auto w-full">
        <form onSubmit={handleSubmit} className="space-y-4">
          <TextInput
            label="Benutzername"
            autoComplete="username"
            isRequired
            value={username}
            onChange={setUsername}
          />

          <TextInput
            label="Passwort"
            type="password"
            autoComplete="new-password"
            isRequired
            value={password}
            onChange={(value) => {
              setPassword(value)
              setPasswordError(null)
            }}
          />

          <TextInput
            label="Passwort bestätigen"
            type="password"
            autoComplete="new-password"
            isRequired
            value={confirmPassword}
            onChange={(value) => {
              setConfirmPassword(value)
              setPasswordError(null)
            }}
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

          {passwordError && <ErrorState message={passwordError} />}

          {error && (
            <ErrorState message="Der Nutzer konnte nicht erstellt werden." />
          )}

          <div className="flex flex-wrap justify-end gap-2 pt-2">
            <Button
              label="Abbrechen"
              variant="secondary"
              href="/user-management"
            />
            <Button
              type="submit"
              label="Nutzer erstellen"
              variant="primary"
              isLoading={isPending}
            />
          </div>
        </form>
      </Card>
    </PageSection>
  )
}
