import { Badge } from "@astryxdesign/core/Badge"
import { HStack } from "@astryxdesign/core/HStack"
import { IconButton } from "@astryxdesign/core/IconButton"
import {
  pixel,
  proportional,
  Table,
  type TableColumn,
  useTableColumnSettings,
  useTableColumnSettingsState,
  useTableSortable,
  useTableSortableState,
} from "@astryxdesign/core/Table"
import { Text } from "@astryxdesign/core/Text"
import { Link, useNavigate } from "@tanstack/react-router"
import { Pencil } from "lucide-react"
import { useMemo, useState } from "react"
import type { ClothingLocation } from "#/clothing/model/clothingLocations.ts"
import TableToolbar from "#/components/base/TableToolbar"
import { formatDate } from "#/lib/date"
import type { Member } from "#/members/model/member.ts"

interface MembersTableProps {
  members: Member[]
  locationsByMember: Map<number, ClothingLocation[]>
}

const MEMBER_COLUMN_OPTIONS = [
  { key: "name", label: "Name", isAlwaysVisible: true },
  { key: "locations", label: "Standorte" },
  { key: "createdAt", label: "Erstellt am" },
  { key: "actions", label: "Aktionen", isAlwaysVisible: true },
]

const MEMBER_COLUMN_KEYS = MEMBER_COLUMN_OPTIONS.map((option) => option.key)

export default function MembersTable({
  members,
  locationsByMember,
}: MembersTableProps) {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState("")
  const [activeColumnKeys, setActiveColumnKeys] = useState<string[]>([
    ...MEMBER_COLUMN_KEYS,
  ])

  const columnSettings = useTableColumnSettingsState({
    columns: MEMBER_COLUMN_OPTIONS,
    activeColumnKeys,
    onChangeActiveColumnKeys: (keys) => setActiveColumnKeys([...keys]),
  })
  const columnSettingsPlugin = useTableColumnSettings<Member>(
    columnSettings.columnSettingsConfig,
  )

  const filteredMembers = useMemo(() => {
    const terms = searchTerm
      .toLowerCase()
      .split(",")
      .map((term) => term.trim())
      .filter((term) => term.length > 0)

    if (terms.length === 0) {
      return members
    }

    return members.filter((member) => {
      const memberLocations = locationsByMember.get(member.id) ?? []
      const haystack = [
        member.name,
        ...memberLocations.map((location) => location.name),
        formatDate(member.metaData.createdAt) ?? "",
      ]
        .join(" ")
        .toLowerCase()

      return terms.every((term) => haystack.includes(term))
    })
  }, [locationsByMember, members, searchTerm])

  const { sortedData, sortConfig } = useTableSortableState<Member>({
    data: filteredMembers,
    defaultSort: [{ sortKey: "name", direction: "ascending" }],
    allowUnsortedState: false,
    comparators: {
      createdAt: (a, b) =>
        new Date(a.metaData.createdAt).getTime() -
        new Date(b.metaData.createdAt).getTime(),
    },
  })
  const sortPlugin = useTableSortable<Member>(sortConfig)

  const columns: TableColumn<Member>[] = [
    {
      key: "name",
      header: "Name",
      width: proportional(2),
      sortable: true,
      resizable: false,
      renderCell: (member) => (
        <Link
          to="/members/$memberId"
          params={{ memberId: String(member.id) }}
          className="hover:underline"
        >
          {member.name}
        </Link>
      ),
    },
    {
      key: "locations",
      header: "Standorte",
      width: proportional(2),
      sortable: true,
      resizable: false,
      renderCell: (member) => {
        const memberLocations = locationsByMember.get(member.id) ?? []

        if (memberLocations.length === 0) {
          return <Text type="supporting">–</Text>
        }

        return (
          <HStack gap={1} wrap="wrap" vAlign="center">
            {memberLocations.map((location) => (
              <Link
                key={location.id}
                to="/clothing-management/locations/$clothingLocationId/edit"
                params={{ clothingLocationId: String(location.id) }}
              >
                <Badge label={location.name} variant="neutral" />
              </Link>
            ))}
          </HStack>
        )
      },
    },
    {
      key: "createdAt",
      header: "Erstellt am",
      width: pixel(130),
      sortable: true,
      resizable: false,
      renderCell: (member) => formatDate(member.metaData.createdAt) ?? "-",
    },
    {
      key: "actions",
      header: "Aktionen",
      width: pixel(64),
      align: "end",
      resizable: false,
      renderCell: (member) => (
        <HStack gap={1} hAlign="end">
          <IconButton
            label={`Mitglied ${member.name} bearbeiten`}
            tooltip="Bearbeiten"
            icon={<Pencil className="size-4" />}
            variant="secondary"
            size="lg"
            onClick={() => {
              void navigate({
                to: "/members/$memberId/edit",
                params: { memberId: String(member.id) },
              })
            }}
          />
        </HStack>
      ),
    },
  ]

  return (
    <div className="space-y-3">
      <TableToolbar
        searchLabel="Mitglieder suchen"
        searchPlaceholder="Mitglieder suchen..."
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        columnOptions={MEMBER_COLUMN_OPTIONS}
        activeColumnKeys={columnSettings.activeColumnKeys}
        onChangeActiveColumnKeys={columnSettings.setActiveColumnKeys}
      />
      <Table
        data={sortedData}
        columns={columns}
        idKey="id"
        plugins={{ sort: sortPlugin, columnSettings: columnSettingsPlugin }}
      />
    </div>
  )
}
