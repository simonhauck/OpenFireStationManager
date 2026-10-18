import { AlertDialog } from "@astryxdesign/core/AlertDialog"
import { Badge } from "@astryxdesign/core/Badge"
import { EmptyState } from "@astryxdesign/core/EmptyState"
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
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"
import { Pencil, Trash2 } from "lucide-react"
import { useMemo, useState } from "react"
import type { ClothingLocation } from "#/clothing/service/clothingLocationsQueries"
import { deleteClothingLocationMutation } from "#/clothing/service/clothingLocationsQueries"
import FormattedDate from "#/components/base/FormattedDate"
import TableToolbar from "#/components/base/TableToolbar"
import { useClientPagination } from "#/components/base/useClientPagination"
import MemberName from "#/members/components/shared/MemberName"
import { useMemberNameLookup } from "#/members/service/memberQueries"

const LOCATION_TYPE_LABELS: Record<ClothingLocation["type"], string> = {
  POOL: "Pool",
  WAESCHE: "Wäsche",
  PERSONAL: "Persönlicher Standort",
  OTHER: "Sonstiges",
}

interface ClothingLocationsTableProps {
  locations: ClothingLocation[]
}

type ClothingLocationRow = ClothingLocation & {
  memberName?: string
}

const LOCATION_COLUMN_OPTIONS = [
  { key: "id", label: "ID" },
  { key: "name", label: "Ort", isAlwaysVisible: true },
  { key: "member", label: "Mitglied" },
  { key: "type", label: "Typ" },
  { key: "comment", label: "Kommentar" },
  { key: "onlyVisibleForKleiderwart", label: "Nur Kleiderwart" },
  { key: "createdAt", label: "Erstellt am" },
  { key: "actions", label: "Aktionen", isAlwaysVisible: true },
]

const LOCATION_COLUMN_KEYS = LOCATION_COLUMN_OPTIONS.map((option) => option.key)

export default function ClothingLocationsTable({
  locations,
}: ClothingLocationsTableProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [activeColumnKeys, setActiveColumnKeys] = useState<string[]>([
    ...LOCATION_COLUMN_KEYS,
  ])
  const lookupMemberName = useMemberNameLookup()

  const columnSettings = useTableColumnSettingsState({
    columns: LOCATION_COLUMN_OPTIONS,
    activeColumnKeys,
    onChangeActiveColumnKeys: (keys) => setActiveColumnKeys([...keys]),
  })
  const columnSettingsPlugin = useTableColumnSettings<ClothingLocationRow>(
    columnSettings.columnSettingsConfig,
  )

  const rows = useMemo<ClothingLocationRow[]>(
    () =>
      locations.map((location) => ({
        ...location,
        memberName: lookupMemberName(location.memberId),
      })),
    [locations, lookupMemberName],
  )

  const filteredLocations = useMemo(() => {
    const terms = searchTerm
      .toLowerCase()
      .split(",")
      .map((term) => term.trim())
      .filter((term) => term.length > 0)

    if (terms.length === 0) {
      return rows
    }

    return rows.filter((location) => {
      const haystack = [
        String(location.id),
        location.name,
        location.memberName ?? "",
        LOCATION_TYPE_LABELS[location.type],
        location.comment,
        location.onlyVisibleForKleiderwart ? "Ja" : "Nein",
      ]
        .join(" ")
        .toLowerCase()

      return terms.every((term) => haystack.includes(term))
    })
  }, [rows, searchTerm])

  const { sortedData, sortConfig } = useTableSortableState<ClothingLocationRow>(
    {
      data: filteredLocations,
      defaultSort: [{ sortKey: "id", direction: "descending" }],
      allowUnsortedState: false,
      comparators: {
        id: (a, b) => a.id - b.id,
        member: (a, b) =>
          (a.memberName ?? "").localeCompare(b.memberName ?? ""),
        onlyVisibleForKleiderwart: (a, b) =>
          Number(a.onlyVisibleForKleiderwart) -
          Number(b.onlyVisibleForKleiderwart),
        createdAt: (a, b) =>
          new Date(a.metaData.createdAt).getTime() -
          new Date(b.metaData.createdAt).getTime(),
      },
    },
  )
  const sortPlugin = useTableSortable<ClothingLocationRow>(sortConfig)

  const { pageData, paginationPlugin, rowIndexStart, rowCount, resetPage } =
    useClientPagination(sortedData)

  const columns: TableColumn<ClothingLocationRow>[] = [
    {
      key: "id",
      header: "ID",
      width: pixel(72),
      sortable: true,
      resizable: false,
    },
    {
      key: "name",
      header: "Ort",
      width: proportional(1),
      sortable: true,
      resizable: false,
    },
    {
      key: "member",
      header: "Mitglied",
      width: proportional(1),
      sortable: true,
      resizable: false,
      renderCell: (location) => (
        <MemberName memberId={location.memberId} name={location.memberName} />
      ),
    },
    {
      key: "type",
      header: "Typ",
      width: proportional(1),
      sortable: true,
      resizable: false,
      renderCell: (location) => (
        <Badge label={LOCATION_TYPE_LABELS[location.type]} variant="neutral" />
      ),
    },
    {
      key: "comment",
      header: "Kommentar",
      width: proportional(1),
      sortable: true,
      resizable: false,
      renderCell: (location) => location.comment || "-",
    },
    {
      key: "onlyVisibleForKleiderwart",
      header: "Nur Kleiderwart",
      width: pixel(130),
      sortable: true,
      resizable: false,
      renderCell: (location) =>
        location.onlyVisibleForKleiderwart ? "Ja" : "Nein",
    },
    {
      key: "createdAt",
      header: "Erstellt am",
      width: pixel(130),
      sortable: true,
      resizable: false,
      renderCell: (location) => (
        <FormattedDate value={location.metaData.createdAt} />
      ),
    },
    {
      key: "actions",
      header: "Aktionen",
      width: pixel(112),
      align: "end",
      resizable: false,
      renderCell: (location) => <ClothingLocationActions location={location} />,
    },
  ]

  return (
    <div className="space-y-3">
      <TableToolbar
        searchLabel="Standorte suchen"
        searchPlaceholder="Standorte suchen..."
        searchValue={searchTerm}
        onSearchChange={(term) => {
          setSearchTerm(term)
          resetPage()
        }}
        columnOptions={LOCATION_COLUMN_OPTIONS}
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
        emptyState={<EmptyState title="Keine Standorte gefunden." isCompact />}
      />
    </div>
  )
}

interface ClothingLocationActionsProps {
  location: ClothingLocation
}

function ClothingLocationActions({ location }: ClothingLocationActionsProps) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const { mutate: deleteLocation } = useMutation(
    deleteClothingLocationMutation(queryClient),
  )

  function handleDelete() {
    deleteLocation(location.id, {
      onSuccess: () => setIsDeleteDialogOpen(false),
    })
  }

  return (
    <HStack gap={1} hAlign="end">
      <IconButton
        label={`Standort ${location.name} bearbeiten`}
        tooltip="Bearbeiten"
        icon={<Pencil className="size-4" />}
        variant="secondary"
        size="lg"
        onClick={() => {
          void navigate({
            to: "/clothing-management/locations/$clothingLocationId/edit",
            params: { clothingLocationId: String(location.id) },
          })
        }}
      />
      <IconButton
        label={`Standort ${location.name} löschen`}
        tooltip="Löschen"
        icon={<Trash2 className="size-4" />}
        variant="destructive"
        size="lg"
        onClick={() => setIsDeleteDialogOpen(true)}
      />
      <AlertDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Standort löschen"
        description={`Möchten Sie den Standort "${location.name}" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.`}
        actionLabel="Löschen"
        onAction={handleDelete}
        cancelLabel="Abbrechen"
        actionVariant="destructive"
      />
    </HStack>
  )
}
