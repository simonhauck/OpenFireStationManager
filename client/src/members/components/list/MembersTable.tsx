import { Link } from "@tanstack/react-router"
import { Pencil } from "lucide-react"
import type { DataTableColumn } from "#/components/base/DataTable"
import DataTable from "#/components/base/DataTable"
import { Button } from "#/components/ui/button"
import type { Member } from "#/members/model/member.ts"

interface MembersTableProps {
  members: Member[]
}

export default function MembersTable({ members }: MembersTableProps) {
  const columns: DataTableColumn<Member>[] = [
    {
      id: "name",
      header: "Name",
      getValue: (member: Member) => member.name,
    },
    {
      id: "locations",
      header: "Anzahl Standorte",
      getValue: () => 0,
    },
    {
      id: "createdAt",
      header: "Erstellt am",
      getValue: (member: Member) => new Date(member.metaData.createdAt),
    },
  ]

  return (
    <DataTable
      columns={columns}
      rows={members}
      showSearch={true}
      searchPlaceholder="Mitglieder suchen..."
      emptyMessage="Keine Mitglieder gefunden."
      actionColumn={({ row: member }) => (
        <div className="flex justify-end gap-1">
          <Button asChild size="icon" variant="outline">
            <Link
              to="/members/$memberId/edit"
              params={{ memberId: String(member.id) }}
              aria-label={`Mitglied ${member.name} bearbeiten`}
              title="Bearbeiten"
            >
              <Pencil className="size-4" />
            </Link>
          </Button>
        </div>
      )}
    />
  )
}
