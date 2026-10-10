import { AlertDialog } from "@astryxdesign/core/AlertDialog"
import { HStack } from "@astryxdesign/core/HStack"
import { IconButton } from "@astryxdesign/core/IconButton"
import { useMutation, useQueries, useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"
import { Pencil, Trash2 } from "lucide-react"
import { useState } from "react"
import type { ClothingLocation } from "#/clothing/model/clothingLocations.ts"
import { getClothingLocationItemsQuery } from "#/clothing/service/clothingLocationsQueries"
import type { Member } from "#/members/model/member.ts"
import { deleteMemberMutation } from "#/members/service/memberQueries"

interface MemberActionsProps {
  member: Member
  locations: ClothingLocation[]
}

export default function MemberActions({
  member,
  locations,
}: MemberActionsProps) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const itemQueries = useQueries({
    queries: locations.map((location) => ({
      ...getClothingLocationItemsQuery(location.id),
      enabled: isDeleteDialogOpen,
    })),
  })

  const itemCount = itemQueries.reduce(
    (total, query) => total + (query.data?.length ?? 0),
    0,
  )
  const areItemsLoading = itemQueries.some((query) => query.isLoading)

  const { mutateAsync: deleteMember } = useMutation(
    deleteMemberMutation(queryClient),
  )

  const locationsText = formatCount(locations.length, "Standort", "Standorte")
  const itemsText = formatCount(itemCount, "Kleidungsstück", "Kleidungsstücke")
  const deleteBodyText = `Beim Löschen von "${member.name}" werden ${locationsText} und ${itemsText} freigegeben. Die Standorte bleiben erhalten, aber die Kleidung muss anschließend umgelagert werden.`

  async function handleDelete() {
    setIsDeleting(true)
    const deleteSucceeded = await deleteMember(member.id).then(
      () => true,
      () => false,
    )
    setIsDeleting(false)

    if (deleteSucceeded) {
      setIsDeleteDialogOpen(false)
    }
  }

  return (
    <HStack gap={1} hAlign="end">
      <IconButton
        label={`Mitglied ${member.name} bearbeiten`}
        tooltip="Bearbeiten"
        icon={<Pencil className="size-4" />}
        variant="secondary"
        size="lg"
        onClick={() => {
          void navigate({
            to: "/members/$memberId/edit",
            params: { memberId: String(member.id) },
          })
        }}
      />
      <IconButton
        label={`Mitglied ${member.name} löschen`}
        tooltip="Löschen"
        icon={<Trash2 className="size-4" />}
        variant="destructive"
        size="lg"
        onClick={() => setIsDeleteDialogOpen(true)}
      />
      <AlertDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Mitglied löschen"
        description={deleteBodyText}
        actionLabel="Löschen"
        isActionLoading={areItemsLoading || isDeleting}
        onAction={handleDelete}
        cancelLabel="Abbrechen"
        actionVariant="destructive"
      />
    </HStack>
  )
}

function formatCount(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`
}
