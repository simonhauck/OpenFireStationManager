import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Link, useNavigate } from "@tanstack/react-router"
import type { FormEvent } from "react"
import { useState } from "react"
import ErrorState from "#/components/base/ErrorState"
import LoadingIndicator from "#/components/base/LoadingIndicator"
import PageSection from "#/components/base/PageSection"
import RenderIf from "#/components/base/RenderIf"
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
import { Card, CardContent } from "#/components/ui/card"
import { Input } from "#/components/ui/input"
import { Label } from "#/components/ui/label"
import type { Member } from "#/members/model/member.ts"
import {
  createMemberMutation,
  updateMemberMutation,
  useMembers,
} from "#/members/service/memberQueries"

type MemberFormProps = {
  existingMember?: Member
}

export default function MemberForm({ existingMember }: MemberFormProps) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const isEditing = existingMember != null
  const { data: members, isLoading: isMembersLoading } = useMembers()

  const [name, setName] = useState(existingMember?.name ?? "")
  const [duplicateWarningOpen, setDuplicateWarningOpen] = useState(false)

  const {
    mutate: createMember,
    isPending: isCreatePending,
    error: createError,
  } = useMutation(createMemberMutation(queryClient))

  const {
    mutate: updateMember,
    isPending: isUpdatePending,
    error: updateError,
  } = useMutation(updateMemberMutation(queryClient))

  const isPending = isCreatePending || isUpdatePending
  const error = createError ?? updateError
  const title = isEditing ? "Mitglied bearbeiten" : "Mitglied erstellen"
  const description = isEditing
    ? "Bearbeiten Sie den Namen des Mitglieds."
    : "Erfassen Sie die Daten für ein neues Mitglied."

  function saveMember() {
    if (isEditing) {
      updateMember(
        {
          id: Number(existingMember.id),
          body: { name },
        },
        {
          onSuccess: () => {
            void navigate({ to: "/members" })
          },
        },
      )
      return
    }

    createMember(
      { name },
      {
        onSuccess: () => {
          void navigate({ to: "/members" })
        },
      },
    )
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()

    const normalizedName = name.trim().toLowerCase()
    const hasDuplicate =
      !isEditing &&
      members?.some(
        (member) => member.name.trim().toLowerCase() === normalizedName,
      )

    if (hasDuplicate) {
      setDuplicateWarningOpen(true)
      return
    }

    saveMember()
  }

  return (
    <>
      <PageSection title={title} subtitle={description}>
        <Card className="mx-auto w-full max-w-2xl">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  required
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
              </div>

              <RenderIf when={!isEditing && isMembersLoading}>
                <LoadingIndicator label="Mitglieder werden geladen..." />
              </RenderIf>

              <RenderIf when={!!error}>
                <ErrorState message="Das Mitglied konnte nicht gespeichert werden." />
              </RenderIf>

              <div className="flex flex-wrap justify-end gap-2 pt-2">
                <Button type="button" variant="outline" asChild>
                  <Link to="/members">Abbrechen</Link>
                </Button>
                <Button
                  type="submit"
                  disabled={isPending || (!isEditing && isMembersLoading)}
                >
                  <RenderIf when={isPending}>Wird gespeichert...</RenderIf>
                  <RenderIf when={!isPending}>Speichern</RenderIf>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </PageSection>
      <AlertDialog
        open={duplicateWarningOpen}
        onOpenChange={setDuplicateWarningOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Doppelter Name</AlertDialogTitle>
            <AlertDialogDescription>
              Ein Mitglied mit diesem Namen existiert bereits. Möchten Sie das
              Mitglied trotzdem erstellen?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction type="button" onClick={saveMember}>
              Trotzdem erstellen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
