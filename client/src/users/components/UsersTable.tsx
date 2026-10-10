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
import { useNavigate } from "@tanstack/react-router"
import { KeyRound, Pencil } from "lucide-react"
import { useMemo, useState } from "react"
import TableToolbar from "#/components/base/TableToolbar"
import { formatDate } from "#/lib/date"
import type { UserAccount } from "#/users/model/user"
import { getRoleLabel } from "#/users/roleMetadata"

interface UsersTableProps {
  users: UserAccount[]
}

const USER_COLUMN_OPTIONS = [
  { key: "id", label: "ID" },
  { key: "username", label: "Benutzername", isAlwaysVisible: true },
  { key: "firstName", label: "Vorname" },
  { key: "lastName", label: "Nachname" },
  { key: "roles", label: "Rollen" },
  { key: "createdAt", label: "Erstellt am" },
  { key: "actions", label: "Aktionen", isAlwaysVisible: true },
]

const USER_COLUMN_KEYS = USER_COLUMN_OPTIONS.map((option) => option.key)

export default function UsersTable({ users }: UsersTableProps) {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState("")
  const [activeColumnKeys, setActiveColumnKeys] = useState<string[]>([
    ...USER_COLUMN_KEYS,
  ])

  const columnSettings = useTableColumnSettingsState({
    columns: USER_COLUMN_OPTIONS,
    activeColumnKeys,
    onChangeActiveColumnKeys: (keys) => setActiveColumnKeys([...keys]),
  })
  const columnSettingsPlugin = useTableColumnSettings<UserAccount>(
    columnSettings.columnSettingsConfig,
  )

  const filteredUsers = useMemo(() => {
    const terms = searchTerm
      .toLowerCase()
      .split(",")
      .map((term) => term.trim())
      .filter((term) => term.length > 0)

    if (terms.length === 0) {
      return users
    }

    return users.filter((user) => {
      const haystack = [
        String(user.id),
        user.username,
        user.firstName,
        user.lastName,
        ...user.roles.map(getRoleLabel),
        formatDate(user.metaData.createdAt) ?? "",
      ]
        .join(" ")
        .toLowerCase()

      return terms.every((term) => haystack.includes(term))
    })
  }, [searchTerm, users])

  const { sortedData, sortConfig } = useTableSortableState<UserAccount>({
    data: filteredUsers,
    defaultSort: [{ sortKey: "id", direction: "ascending" }],
    allowUnsortedState: false,
    comparators: {
      id: (a, b) => a.id - b.id,
      createdAt: (a, b) =>
        new Date(a.metaData.createdAt).getTime() -
        new Date(b.metaData.createdAt).getTime(),
    },
  })
  const sortPlugin = useTableSortable<UserAccount>(sortConfig)

  const columns: TableColumn<UserAccount>[] = [
    {
      key: "id",
      header: "ID",
      width: pixel(72),
      sortable: true,
      resizable: false,
    },
    {
      key: "username",
      header: "Benutzername",
      width: proportional(1),
      sortable: true,
      resizable: false,
    },
    {
      key: "firstName",
      header: "Vorname",
      width: proportional(1),
      sortable: true,
      resizable: false,
    },
    {
      key: "lastName",
      header: "Nachname",
      width: proportional(1),
      sortable: true,
      resizable: false,
    },
    {
      key: "roles",
      header: "Rollen",
      width: proportional(1),
      sortable: true,
      resizable: false,
      renderCell: (user) => (
        <HStack gap={1} wrap="wrap" vAlign="center">
          {user.roles.map((role) => (
            <Badge key={role} label={getRoleLabel(role)} variant="neutral" />
          ))}
        </HStack>
      ),
    },
    {
      key: "createdAt",
      header: "Erstellt am",
      width: pixel(130),
      sortable: true,
      resizable: false,
      renderCell: (user) => formatDate(user.metaData.createdAt) ?? "-",
    },
    {
      key: "actions",
      header: "Aktionen",
      width: pixel(96),
      align: "end",
      resizable: false,
      renderCell: (user) => (
        <HStack gap={1} hAlign="end">
          <IconButton
            label={`Passwort für Nutzer ${user.username} ändern`}
            tooltip="Passwort ändern"
            icon={<KeyRound className="size-4" />}
            variant="secondary"
            size="lg"
            onClick={() => {
              void navigate({
                to: "/user-management/$userId/change-password",
                params: { userId: String(user.id) },
              })
            }}
          />
          <IconButton
            label={`Nutzer ${user.username} bearbeiten`}
            tooltip="Nutzer bearbeiten"
            icon={<Pencil className="size-4" />}
            variant="secondary"
            size="lg"
            onClick={() => {
              void navigate({
                to: "/user-management/$userId/edit",
                params: { userId: String(user.id) },
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
        searchLabel="Suchen"
        searchPlaceholder="Suchen..."
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        columnOptions={USER_COLUMN_OPTIONS}
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
