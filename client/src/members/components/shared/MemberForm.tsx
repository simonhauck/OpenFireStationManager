import { AlertDialog } from "@astryxdesign/core/AlertDialog"
import { Button } from "@astryxdesign/core/Button"
import { Card } from "@astryxdesign/core/Card"
import { TextInput } from "@astryxdesign/core/TextInput"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"
import type { FormEvent } from "react"
import { useState } from "react"
import ErrorState from "#/components/base/ErrorState"
import LoadingIndicator from "#/components/base/LoadingIndicator"
import PageSection from "#/components/base/PageSection"
import RenderIf from "#/components/base/RenderIf"
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
        <Card maxWidth={672} className="mx-auto w-full">
          <form onSubmit={handleSubmit} className="space-y-4">
            <TextInput
              label="Name"
              isRequired
              value={name}
              onChange={setName}
            />

            <RenderIf when={!isEditing && isMembersLoading}>
              <LoadingIndicator label="Mitglieder werden geladen..." />
            </RenderIf>

            <RenderIf when={!!error}>
              <ErrorState message="Das Mitglied konnte nicht gespeichert werden." />
            </RenderIf>

            <div className="flex flex-wrap justify-end gap-2 pt-2">
              <Button label="Abbrechen" variant="secondary" href="/members" />
              <Button
                type="submit"
                label="Speichern"
                variant="primary"
                isDisabled={isPending || (!isEditing && isMembersLoading)}
                isLoading={isPending}
              />
            </div>
          </form>
        </Card>
      </PageSection>

      <AlertDialog
        isOpen={duplicateWarningOpen}
        onOpenChange={setDuplicateWarningOpen}
        title="Doppelter Name"
        description="Ein Mitglied mit diesem Namen existiert bereits. Möchten Sie das Mitglied trotzdem erstellen?"
        actionLabel="Trotzdem erstellen"
        onAction={saveMember}
        cancelLabel="Abbrechen"
        actionVariant="primary"
      />
    </>
  )
}
