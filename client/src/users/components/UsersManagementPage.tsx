import { Link } from "@tanstack/react-router"

import AppBreadcrumb from "#/components/base/AppBreadcrumb"
import ErrorState from "#/components/base/ErrorState"
import LoadingIndicator from "#/components/base/LoadingIndicator"
import RoleGuard from "#/components/base/RoleGuard"
import { Button } from "#/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "#/components/ui/card"
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
    <div className="space-y-4">
      <AppBreadcrumb
        items={[
          { label: "Startseite", to: "/" },
          { label: "Nutzermanagement" },
        ]}
      />
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle>Nutzermanagement</CardTitle>
              <CardDescription>Nutzer und Rollen</CardDescription>
            </div>
            <Button asChild>
              <Link to="/user-management/new">Nutzer erstellen</Link>
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {isLoading && <LoadingIndicator label="Nutzer werden geladen..." />}

          {isError && <ErrorState message="Fehler beim Laden der Nutzer." />}

          {users && <UsersTable users={users} />}
        </CardContent>
      </Card>
    </div>
  )
}
