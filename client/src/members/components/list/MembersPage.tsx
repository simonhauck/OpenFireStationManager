import { Link } from "@tanstack/react-router"
import ErrorState from "#/components/base/ErrorState"
import LoadingIndicator from "#/components/base/LoadingIndicator"
import PageSection from "#/components/base/PageSection"
import RenderIf from "#/components/base/RenderIf"
import RoleGuard from "#/components/base/RoleGuard"
import { Button } from "#/components/ui/button"
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
  const canRenderTable = members !== undefined

  return (
    <PageSection
      title="Mitglieder"
      subtitle="Alle Personen der Feuerwehr"
      buttons={
        <Button asChild>
          <Link to="/members/new">Mitglied erstellen</Link>
        </Button>
      }
    >
      <RenderIf when={isLoading}>
        <LoadingIndicator label="Mitglieder werden geladen..." />
      </RenderIf>

      <RenderIf when={isError}>
        <ErrorState message="Mitglieder konnten nicht geladen werden." />
      </RenderIf>

      <RenderIf when={canRenderTable}>
        <MembersTable members={members ?? []} />
      </RenderIf>
    </PageSection>
  )
}
