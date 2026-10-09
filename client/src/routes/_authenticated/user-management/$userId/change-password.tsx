import { AlertDialog } from "@astryxdesign/core/AlertDialog"
import { Button } from "@astryxdesign/core/Button"
import { Card } from "@astryxdesign/core/Card"
import { TextInput } from "@astryxdesign/core/TextInput"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useState } from "react"

import { changePasswordMutation, getUserByIdQuery } from "#/api/users.queries"
import ErrorState from "#/components/base/ErrorState"
import LoadingIndicator from "#/components/base/LoadingIndicator"
import PageSection from "#/components/base/PageSection"
import RoleGuard from "#/components/base/RoleGuard"

export const Route = createFileRoute(
  "/_authenticated/user-management/$userId/change-password",
)({
  component: ChangePasswordPage,
})

function ChangePasswordPage() {
  return (
    <RoleGuard allowedRoles={["ADMIN"]}>
      <ChangePasswordPageContent />
    </RoleGuard>
  )
}

function ChangePasswordPageContent() {
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

  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)

  const {
    mutate: doChangePassword,
    isPending,
    error,
  } = useMutation(changePasswordMutation(queryClient))

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setPasswordError(null)

    if (newPassword !== confirmPassword) {
      setPasswordError(
        "Passwort und Passwortbestätigung stimmen nicht überein.",
      )
      return
    }

    setConfirmDialogOpen(true)
  }

  function handleConfirm() {
    doChangePassword(
      {
        id: numericUserId,
        body: { newPassword },
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
    <>
      <PageSection
        title="Passwort ändern"
        subtitle={`Neues Passwort für ${user.username} festlegen.`}
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
              label="Neues Passwort"
              type="password"
              autoComplete="new-password"
              isRequired
              value={newPassword}
              onChange={(value) => {
                setNewPassword(value)
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

            {passwordError && <ErrorState message={passwordError} />}

            {error && (
              <ErrorState message="Das Passwort konnte nicht geändert werden." />
            )}

            <div className="flex flex-wrap justify-end gap-2 pt-2">
              <Button
                label="Abbrechen"
                variant="secondary"
                onClick={() => {
                  void navigate({
                    to: "/user-management/$userId/edit",
                    params: { userId },
                  })
                }}
              />
              <Button
                type="submit"
                label="Passwort ändern"
                variant="destructive"
                isLoading={isPending}
              />
            </div>
          </form>
        </Card>
      </PageSection>

      <AlertDialog
        isOpen={confirmDialogOpen}
        onOpenChange={setConfirmDialogOpen}
        title="Passwort wirklich ändern?"
        description={`Das Passwort des Nutzers ${user.username} wird unwiderruflich geändert. Der Nutzer muss sich danach mit dem neuen Passwort anmelden.`}
        actionLabel="Passwort ändern"
        onAction={handleConfirm}
        cancelLabel="Abbrechen"
        actionVariant="destructive"
        isActionLoading={isPending}
      />
    </>
  )
}
