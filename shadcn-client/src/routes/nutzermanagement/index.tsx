import { useQuery } from "@tanstack/react-query"
import { Link, createFileRoute } from "@tanstack/react-router"

import { getAllUsersQuery } from "#/api/users.queries"
import ErrorState from "#/components/base/ErrorState"
import LoadingIndicator from "#/components/base/LoadingIndicator"
import RoleGuard from "#/components/base/RoleGuard"
import UsersTable from "#/components/UsersTable"
import { Button } from "#/components/ui/button"

export const Route = createFileRoute("/nutzermanagement/")({
  component: Nutzermanagement,
})

function Nutzermanagement() {
  return (
    <RoleGuard allowedRoles={["ADMIN"]}>
      <NutzermanagementContent />
    </RoleGuard>
  )
}

function NutzermanagementContent() {
  const { data: users, isLoading, isError } = useQuery(getAllUsersQuery())

  return (
    <main className="page-wrap px-4 py-12">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Nutzermanagement</h1>
        <Button asChild>
          <Link to="/nutzermanagement/new">Nutzer erstellen</Link>
        </Button>
      </div>

      {isLoading && <LoadingIndicator label="Nutzer werden geladen..." />}

      {isError && <ErrorState message="Fehler beim Laden der Nutzer." />}

      {users && <UsersTable users={users} />}
    </main>
  )
}
