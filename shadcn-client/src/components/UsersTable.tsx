import type { components } from "#/api/schema"
import { Badge } from "#/components/ui/badge"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "#/components/ui/table"

type UserAccount = components["schemas"]["UserAccount"]

interface UsersTableProps {
  users: UserAccount[]
}

function formatRole(role: UserAccount["roles"][number]): string {
  return role === "ADMIN" ? "Admin" : "Nutzer"
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

export default function UsersTable({ users }: UsersTableProps) {
  return (
    <div className="rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Benutzername</TableHead>
            <TableHead>Vorname</TableHead>
            <TableHead>Nachname</TableHead>
            <TableHead>Rollen</TableHead>
            <TableHead>Erstellt am</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={6}
                className="py-10 text-center text-muted-foreground"
              >
                Keine Nutzer gefunden.
              </TableCell>
            </TableRow>
          ) : (
            users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-mono text-muted-foreground">
                  {user.id}
                </TableCell>
                <TableCell className="font-medium">{user.username}</TableCell>
                <TableCell>{user.firstName}</TableCell>
                <TableCell>{user.lastName}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {user.roles.map((role) => (
                      <Badge key={`${user.id}-${role}`} variant="secondary">
                        {formatRole(role)}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDate(user.metaData.createdAt)}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
