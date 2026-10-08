import { useMutation, useQueries, useQueryClient } from "@tanstack/react-query"
import { Link, useNavigate, useParams } from "@tanstack/react-router"
import { Pencil, Trash2 } from "lucide-react"
import type { ClothingLocation } from "#/clothing/model/clothingLocations.ts"
import {
  getClothingLocationItemsQuery,
  useClothingLocations,
} from "#/clothing/service/clothingLocationsQueries"
import DeleteDialogComponent from "#/components/base/DeleteDialogComponent"
import ErrorState from "#/components/base/ErrorState"
import FormattedDate from "#/components/base/FormattedDate"
import LoadingIndicator from "#/components/base/LoadingIndicator"
import PageSection from "#/components/base/PageSection"
import RenderIf from "#/components/base/RenderIf"
import RoleGuard from "#/components/base/RoleGuard"
import { Button } from "#/components/ui/button"
import type { MemberClothingGroupData } from "#/members/components/detail/MemberClothingSection"
import MemberClothingSection from "#/members/components/detail/MemberClothingSection"
import MemberLocationsSection from "#/members/components/detail/MemberLocationsSection"
import type { Member } from "#/members/model/member.ts"
import {
  deleteMemberMutation,
  useMemberById,
} from "#/members/service/memberQueries"

export default function MemberDetailPage() {
  return (
    <RoleGuard allowedRoles={["KLEIDERWART"]}>
      <MemberDetailPageContent />
    </RoleGuard>
  )
}

function MemberDetailPageContent() {
  const { memberId } = useParams({
    from: "/_authenticated/members/$memberId/",
  })
  const numericMemberId = Number(memberId)
  const { data: member, isLoading, isError } = useMemberById(numericMemberId)
  const { data: locations, isLoading: areLocationsLoading } =
    useClothingLocations()

  if (!Number.isFinite(numericMemberId)) {
    return <ErrorState message="Ungültige Mitglied-ID." />
  }

  if (isLoading || areLocationsLoading) {
    return <LoadingIndicator label="Mitglied wird geladen..." />
  }

  if (isError || !member) {
    return <ErrorState message="Mitglied konnte nicht geladen werden." />
  }

  return <MemberDetailContent member={member} locations={locations ?? []} />
}

interface MemberDetailContentProps {
  member: Member
  locations: ClothingLocation[]
}

function MemberDetailContent({ member, locations }: MemberDetailContentProps) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const memberLocations = locations.filter(
    (location) => location.memberId === member.id,
  )
  const itemQueries = useQueries({
    queries: memberLocations.map((location) =>
      getClothingLocationItemsQuery(location.id),
    ),
  })
  const clothingGroups: MemberClothingGroupData[] = memberLocations.map(
    (location, index) => ({
      location,
      items: itemQueries[index]?.data,
      isLoading: itemQueries[index]?.isLoading ?? false,
      isError: itemQueries[index]?.isError ?? false,
    }),
  )

  const itemCount = clothingGroups.reduce(
    (total, group) => total + (group.items?.length ?? 0),
    0,
  )
  const areItemsLoading = clothingGroups.some((group) => group.isLoading)

  const { mutateAsync: deleteMember, error: deleteError } = useMutation(
    deleteMemberMutation(queryClient),
  )

  const locationsText = formatCount(
    memberLocations.length,
    "Standort",
    "Standorte",
  )
  const itemsText = formatCount(itemCount, "Kleidungsstück", "Kleidungsstücke")
  const deleteBodyText = `Beim Löschen von "${member.name}" werden ${locationsText} und ${itemsText} freigegeben. Die Standorte bleiben erhalten, aber die Kleidung muss anschließend umgelagert werden.`

  async function handleDelete() {
    const deleteSucceeded = await deleteMember(member.id).then(
      () => true,
      () => false,
    )

    if (deleteSucceeded) {
      await navigate({ to: "/members" })
    }
  }

  return (
    <PageSection
      title={member.name}
      subtitle="Mitglied"
      buttons={
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link
              to="/members/$memberId/edit"
              params={{ memberId: String(member.id) }}
            >
              <Pencil className="size-4" />
              Bearbeiten
            </Link>
          </Button>

          <DeleteDialogComponent
            onDelete={handleDelete}
            headline="Mitglied löschen"
            bodyText={deleteBodyText}
            confirmText="Löschen"
          >
            <Button variant="destructive" disabled={areItemsLoading}>
              <Trash2 className="size-4" />
              Löschen
            </Button>
          </DeleteDialogComponent>
        </div>
      }
    >
      <div
        data-testid="member-metadata"
        className="text-muted-foreground flex flex-wrap gap-x-6 gap-y-1 text-sm"
      >
        <span>
          Erstellt am <FormattedDate value={member.metaData.createdAt} /> von{" "}
          {member.metaData.createdBy}
        </span>
        <span>
          Zuletzt geändert am{" "}
          <FormattedDate value={member.metaData.lastModifiedAt} /> von{" "}
          {member.metaData.lastModifiedBy}
        </span>
      </div>

      <RenderIf when={deleteError != null}>
        <ErrorState message="Mitglied konnte nicht gelöscht werden." />
      </RenderIf>

      <MemberLocationsSection locations={memberLocations} />

      <MemberClothingSection groups={clothingGroups} />
    </PageSection>
  )
}

function formatCount(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`
}
