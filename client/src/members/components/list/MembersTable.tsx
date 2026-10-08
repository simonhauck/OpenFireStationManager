import { Link } from "@tanstack/react-router"
import { Pencil } from "lucide-react"
import type { ClothingLocation } from "#/clothing/model/clothingLocations.ts"
import type { DataTableColumn } from "#/components/base/DataTable"
import DataTable from "#/components/base/DataTable"
import RenderIf from "#/components/base/RenderIf"
import { Badge } from "#/components/ui/badge"
import { Button } from "#/components/ui/button"
import type { Member } from "#/members/model/member.ts"

interface MembersTableProps {
  members: Member[]
  locationsByMember: Map<number, ClothingLocation[]>
}

export default function MembersTable({
  members,
  locationsByMember,
}: MembersTableProps) {
  const columns: DataTableColumn<Member>[] = [
    {
      id: "name",
      header: "Name",
      renderCell: (member: Member) => (
        <Link
          to="/members/$memberId"
          params={{ memberId: String(member.id) }}
          className="hover:underline"
        >
          {member.name}
        </Link>
      ),
      getValue: (member: Member) => member.name,
    },
    {
      id: "locations",
      header: "Standorte",
      renderCell: (member: Member) => {
        const memberLocations = locationsByMember.get(member.id) ?? []

        return (
          <>
            <RenderIf when={memberLocations.length === 0}>
              <span className="text-muted-foreground">–</span>
            </RenderIf>

            <RenderIf when={memberLocations.length > 0}>
              <div className="flex flex-wrap gap-1">
                {memberLocations.map((location) => (
                  <Link
                    key={location.id}
                    to="/clothing-management/locations/$clothingLocationId/edit"
                    params={{ clothingLocationId: String(location.id) }}
                  >
                    <Badge variant="outline">{location.name}</Badge>
                  </Link>
                ))}
              </div>
            </RenderIf>
          </>
        )
      },
      getValue: (member: Member) =>
        (locationsByMember.get(member.id) ?? []).map(
          (location: ClothingLocation) => location.name,
        ),
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
