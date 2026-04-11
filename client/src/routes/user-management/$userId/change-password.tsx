import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router"
import { useState } from "react"

import { changePasswordMutation, getUserByIdQuery } from "#/api/users.queries"
import ErrorState from "#/components/base/ErrorState"
import LoadingIndicator from "#/components/base/LoadingIndicator"
import RoleGuard from "#/components/base/RoleGuard"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "#/components/ui/alert-dialog"
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

export const Route = createFileRoute(
  "/user-management/$userId/change-password",
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
      <Card className="mx-auto w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Passwort ändern</CardTitle>
          <CardDescription>
            Setzen Sie ein neues Passwort für den Nutzer{" "}
            <span className="font-medium">{user.username}</span>.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="username">Benutzername</Label>
              <Input id="username" value={user.username} disabled readOnly />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="new-password">Neues Passwort</Label>
              <Input
                id="new-password"
                type="password"
                autoComplete="new-password"
                required
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value)
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

            {passwordError && <ErrorState message={passwordError} />}

            {error && (
              <ErrorState message="Das Passwort konnte nicht geändert werden." />
            )}

            <div className="flex flex-wrap justify-end gap-2 pt-2">
              <Button type="button" variant="outline" asChild>
                <Link to="/user-management/$userId/edit" params={{ userId }}>
                  Abbrechen
                </Link>
              </Button>
              <Button type="submit" variant="destructive" disabled={isPending}>
                {isPending ? "Wird gespeichert..." : "Passwort ändern"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Passwort wirklich ändern?</AlertDialogTitle>
            <AlertDialogDescription>
              Das Passwort des Nutzers{" "}
              <span className="font-medium">{user.username}</span> wird
              unwiderruflich geändert. Der Nutzer muss sich danach mit dem neuen
              Passwort anmelden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleConfirm}
            >
              Passwort ändern
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
