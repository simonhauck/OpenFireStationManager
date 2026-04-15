import { Link } from "@tanstack/react-router"
import { KeyRound, Pencil } from "lucide-react"

import DataTable from "#/components/base/DataTable"
import type { DataTableColumn } from "#/components/base/DataTable"
import { Button } from "#/components/ui/button"
import type { components } from "#/api/schema"
import { getRoleLabel } from "#/users/roleMetadata"

type UserAccount = components["schemas"]["UserAccount"]

interface UsersTableProps {
  users: UserAccount[]
}

export default function UsersTable({ users }: UsersTableProps) {
  const columns: DataTableColumn<UserAccount>[] = [
    {
      id: "id",
      header: "ID",
      getValue: (user: UserAccount) => user.id,
    },
    {
      id: "username",
      header: "Benutzername",
      getValue: (user: UserAccount) => user.username,
    },
    {
      id: "firstName",
      header: "Vorname",
      getValue: (user: UserAccount) => user.firstName,
    },
    {
      id: "lastName",
      header: "Nachname",
      getValue: (user: UserAccount) => user.lastName,
    },
    {
      id: "roles",
      header: "Rollen",
      getValue: (user: UserAccount) => user.roles.map(getRoleLabel),
    },
    {
      id: "createdAt",
      header: "Erstellt am",
      getValue: (user: UserAccount) => new Date(user.metaData.createdAt),
    },
  ]

  return (
    <DataTable
      columns={columns}
      rows={users}
      actionColumn={({ row: user }) => {
        return (
          <div className="flex justify-end gap-1">
            <Button asChild size="icon" variant="outline">
              <Link
                to="/user-management/$userId/change-password"
                params={{ userId: String(user.id) }}
                aria-label={`Passwort fuer Nutzer ${user.username} ändern`}
                title="Passwort ändern"
              >
                <KeyRound className="size-4" />
              </Link>
            </Button>
            <Button asChild size="icon" variant="outline">
              <Link
                to="/user-management/$userId/edit"
                params={{ userId: String(user.id) }}
                aria-label={`Nutzer ${user.username} bearbeiten`}
                title="Nutzer bearbeiten"
              >
                <Pencil className="size-4" />
              </Link>
            </Button>
          </div>
        )
      }}
      emptyMessage="Keine Nutzer gefunden."
    />
  )
}
