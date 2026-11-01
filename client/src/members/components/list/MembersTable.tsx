import { HStack } from "@astryxdesign/core/HStack"
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
import { useMemo, useState } from "react"
import LocationName from "#/clothing/components/shared/LocationName"
import type { ClothingLocation } from "#/clothing/model/clothingLocations.ts"
import TableToolbar from "#/components/base/TableToolbar"
import { useClientPagination } from "#/components/base/useClientPagination"
import { formatDate } from "#/lib/date"
import MemberActions from "#/members/components/list/MemberActions"
import MemberName from "#/members/components/shared/MemberName"
import type { Member } from "#/members/model/member.ts"
import { filterMembers } from "#/members/model/memberFilters.ts"

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

  const filteredMembers = useMemo(
    () => filterMembers(members, locationsByMember, searchTerm),
    [locationsByMember, members, searchTerm],
  )

  const { sortedData, sortConfig } = useTableSortableState<Member>({
    data: filteredMembers,
    defaultSort: [{ sortKey: "createdAt", direction: "descending" }],
    allowUnsortedState: false,
    comparators: {
      createdAt: (a, b) =>
        new Date(a.metaData.createdAt).getTime() -
        new Date(b.metaData.createdAt).getTime(),
    },
  })
  const sortPlugin = useTableSortable<Member>(sortConfig)

  const { pageData, paginationPlugin, rowIndexStart, rowCount, resetPage } =
    useClientPagination(sortedData)

  const columns: TableColumn<Member>[] = [
    {
      key: "name",
      header: "Name",
      width: proportional(2),
      sortable: true,
      resizable: false,
      renderCell: (member) => (
        <MemberName memberId={member.id} name={member.name} />
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
          <HStack gap={2} wrap="wrap" vAlign="center">
            {memberLocations.map((location) => (
              <LocationName
                key={location.id}
                locationId={location.id}
                name={location.name}
              />
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
      width: pixel(112),
      align: "end",
      resizable: false,
      renderCell: (member) => (
        <MemberActions
          member={member}
          locations={locationsByMember.get(member.id) ?? []}
        />
      ),
    },
  ]

  return (
    <div className="space-y-3">
      <TableToolbar
        searchLabel="Mitglieder suchen"
        searchPlaceholder="Mitglieder suchen..."
        searchValue={searchTerm}
        onSearchChange={(term) => {
          setSearchTerm(term)
          resetPage()
        }}
        columnOptions={MEMBER_COLUMN_OPTIONS}
        activeColumnKeys={columnSettings.activeColumnKeys}
        onChangeActiveColumnKeys={columnSettings.setActiveColumnKeys}
      />
      <Table
        data={pageData}
        columns={columns}
        idKey="id"
        rowIndexStart={rowIndexStart}
        rowCount={rowCount}
        plugins={{
          sort: sortPlugin,
          columnSettings: columnSettingsPlugin,
          pagination: paginationPlugin,
        }}
      />
    </div>
  )
}
