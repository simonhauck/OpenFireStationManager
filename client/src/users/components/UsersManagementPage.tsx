import { Link } from "@tanstack/react-router"
import { Plus } from "lucide-react"
import ErrorState from "#/components/base/ErrorState"
import LoadingIndicator from "#/components/base/LoadingIndicator"
import PageSection from "#/components/base/PageSection"
import RenderIf from "#/components/base/RenderIf"
import RoleGuard from "#/components/base/RoleGuard"
import { Button } from "#/components/ui/button"
import UsersTable from "#/users/components/UsersTable"
import { useUsers } from "#/users/service/usersQueries"

export default function UsersManagementPage() {
  return (
    <RoleGuard allowedRoles={["ADMIN"]}>
      <UsersManagementPageContent />
    </RoleGuard>
  )
}

function UsersManagementPageContent() {
  const { data: users, isLoading, isError } = useUsers()

  return (
    <PageSection
      title="Nutzer Management"
      subtitle="Nutzer und Rollen"
      buttons={
        <Button asChild>
          <Link to="/user-management/new">
            <Plus className="size-4" />
            Nutzer erstellen
          </Link>
        </Button>
      }
    >
      <RenderIf when={isLoading}>
        <LoadingIndicator label="Nutzer werden geladen..." />
      </RenderIf>

      <RenderIf when={isError}>
        <ErrorState message="Fehler beim Laden der Nutzer." />
      </RenderIf>

      <RenderIf when={!isLoading && !isError && !!users}>
        <UsersTable users={users ?? []} />
      </RenderIf>
    </PageSection>
  )
}
