import { Button } from "@astryxdesign/core/Button"
import type { ClothingLocation } from "#/clothing/model/clothingLocations.ts"
import { useClothingLocations } from "#/clothing/service/clothingLocationsQueries"
import ErrorState from "#/components/base/ErrorState"
import LoadingIndicator from "#/components/base/LoadingIndicator"
import PageSection from "#/components/base/PageSection"
import RenderIf from "#/components/base/RenderIf"
import RoleGuard from "#/components/base/RoleGuard"
import MembersTable from "#/members/components/list/MembersTable"
import { useMembers } from "#/members/service/memberQueries"

export default function MembersPage() {
  return (
    <RoleGuard allowedRoles={["KLEIDERWART"]}>
      <MembersPageContent />
    </RoleGuard>
  )
}

function MembersPageContent() {
  const { data: members, isLoading, isError } = useMembers()
  const {
    data: locations,
    isLoading: areLocationsLoading,
    isError: isLocationsError,
  } = useClothingLocations()

  const locationsByMember = new Map<number, ClothingLocation[]>()
  for (const location of locations ?? []) {
    if (location.memberId === undefined) continue
    const memberLocations = locationsByMember.get(location.memberId) ?? []
    memberLocations.push(location)
    locationsByMember.set(location.memberId, memberLocations)
  }

  const isPageLoading = isLoading || areLocationsLoading
  const hasError = isError || isLocationsError
  const canRenderTable = members !== undefined && locations !== undefined

  return (
    <PageSection
      title="Mitglieder"
      subtitle="Alle Personen der Feuerwehr"
      buttons={
        <Button
          label="Mitglied erstellen"
          variant="primary"
          href="/members/new"
        />
      }
    >
      <RenderIf when={isPageLoading}>
        <LoadingIndicator label="Mitglieder werden geladen..." />
      </RenderIf>

      <RenderIf when={hasError}>
        <ErrorState message="Mitglieder konnten nicht geladen werden." />
      </RenderIf>

      <RenderIf when={canRenderTable}>
        <MembersTable
          members={members ?? []}
          locationsByMember={locationsByMember}
        />
      </RenderIf>
    </PageSection>
  )
}
