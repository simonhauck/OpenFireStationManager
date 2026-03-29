import { Link } from "@tanstack/react-router"
import { KeyRound, Pencil } from "lucide-react"

import FormattedDate from "#/components/base/FormattedDate"
import { Badge } from "#/components/ui/badge"
import { Button } from "#/components/ui/button"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "#/components/ui/table"
import type { components } from "#/api/schema"
import { getRoleLabel } from "#/users/roleMetadata"

type UserAccount = components["schemas"]["UserAccount"]

interface UsersTableProps {
  users: UserAccount[]
}

export default function UsersTable({ users }: UsersTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>ID</TableHead>
          <TableHead>Benutzername</TableHead>
          <TableHead>Vorname</TableHead>
          <TableHead>Nachname</TableHead>
          <TableHead>Rollen</TableHead>
          <TableHead>Erstellt am</TableHead>
          <TableHead className="text-right">Aktionen</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.length === 0 ? (
          <TableRow>
            <TableCell colSpan={7}>Keine Nutzer gefunden.</TableCell>
          </TableRow>
        ) : (
          users.map((user) => (
            <TableRow key={user.id}>
              <TableCell>{user.id}</TableCell>
              <TableCell>{user.username}</TableCell>
              <TableCell>{user.firstName}</TableCell>
              <TableCell>{user.lastName}</TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {user.roles.map((role) => (
                    <Badge key={`${user.id}-${role}`} variant="secondary">
                      {getRoleLabel(role)}
                    </Badge>
                  ))}
                </div>
              </TableCell>
              <TableCell>
                <FormattedDate value={user.metaData.createdAt} />
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  <Button asChild size="icon" variant="outline">
                    <Link
                      to="/nutzermanagement/$userId/change-password"
                      params={{ userId: String(user.id) }}
                      aria-label={`Passwort fuer Nutzer ${user.username} ändern`}
                      title="Passwort ändern"
                    >
                      <KeyRound className="size-4" />
                    </Link>
                  </Button>
                  <Button asChild size="icon" variant="outline">
                    <Link
                      to="/nutzermanagement/$userId/edit"
                      params={{ userId: String(user.id) }}
                      aria-label={`Nutzer ${user.username} bearbeiten`}
                      title="Nutzer bearbeiten"
                    >
                      <Pencil className="size-4" />
                    </Link>
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  )
}
