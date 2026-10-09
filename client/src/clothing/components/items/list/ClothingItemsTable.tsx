import { AlertDialog } from "@astryxdesign/core/AlertDialog"
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
import type { ClothingType } from "#/clothing/model/clothingType"
import type { ClothingItem } from "#/clothing/service/clothingItemsQueries"
import { deleteClothingItemMutation } from "#/clothing/service/clothingItemsQueries"
import type { ClothingLocation } from "#/clothing/service/clothingLocationsQueries"
import FormattedDate from "#/components/base/FormattedDate"
import TableToolbar from "#/components/base/TableToolbar"
import { formatDate } from "#/lib/date"

interface ClothingItemsTableProps {
  items: ClothingItem[]
  types: ClothingType[]
  locations: ClothingLocation[]
}

const ITEM_COLUMN_OPTIONS = [
  { key: "id", label: "ID" },
  { key: "barcode", label: "Barcode" },
  { key: "type", label: "Typ", isAlwaysVisible: true },
  { key: "size", label: "Groesse" },
  { key: "location", label: "Standort" },
  { key: "createdAt", label: "Erstellt am" },
  { key: "actions", label: "Aktionen", isAlwaysVisible: true },
]

const ITEM_COLUMN_KEYS = ITEM_COLUMN_OPTIONS.map((option) => option.key)

export default function ClothingItemsTable({
  items,
  types,
  locations,
}: ClothingItemsTableProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [activeColumnKeys, setActiveColumnKeys] = useState<string[]>([
    ...ITEM_COLUMN_KEYS,
  ])

  const columnSettings = useTableColumnSettingsState({
    columns: ITEM_COLUMN_OPTIONS,
    activeColumnKeys,
    onChangeActiveColumnKeys: (keys) => setActiveColumnKeys([...keys]),
  })
  const columnSettingsPlugin = useTableColumnSettings<ClothingItem>(
    columnSettings.columnSettingsConfig,
  )

  const typeNameById = useMemo(
    () => new Map(types.map((type) => [type.id, type.name])),
    [types],
  )

  const locationNameById = useMemo(
    () => new Map(locations.map((location) => [location.id, location.name])),
    [locations],
  )

  const filteredItems = useMemo(() => {
    const terms = searchTerm
      .toLowerCase()
      .split(",")
      .map((term) => term.trim())
      .filter((term) => term.length > 0)

    if (terms.length === 0) {
      return items
    }

    return items.filter((item) => {
      const haystack = [
        String(item.id),
        item.barcode ?? "-",
        typeNameById.get(item.typeId) ?? String(item.typeId),
        item.size,
        item.locationId != null
          ? (locationNameById.get(item.locationId) ?? "-")
          : "-",
        formatDate(item.metaData.createdAt) ?? "-",
      ]
        .join(" ")
        .toLowerCase()

      return terms.every((term) => haystack.includes(term))
    })
  }, [items, locationNameById, searchTerm, typeNameById])

  const { sortedData, sortConfig } = useTableSortableState<ClothingItem>({
    data: filteredItems,
    defaultSort: [{ sortKey: "id", direction: "ascending" }],
    allowUnsortedState: false,
    comparators: {
      id: (a, b) => a.id - b.id,
      createdAt: (a, b) =>
        new Date(a.metaData.createdAt).getTime() -
        new Date(b.metaData.createdAt).getTime(),
    },
  })
  const sortPlugin = useTableSortable<ClothingItem>(sortConfig)

  const columns: TableColumn<ClothingItem>[] = [
    {
      key: "id",
      header: "ID",
      width: pixel(72),
      sortable: true,
      resizable: false,
    },
    {
      key: "barcode",
      header: "Barcode",
      width: proportional(1),
      sortable: true,
      resizable: false,
      renderCell: (item) => item.barcode ?? "-",
    },
    {
      key: "type",
      header: "Typ",
      width: proportional(1),
      sortable: true,
      resizable: false,
      renderCell: (item) =>
        typeNameById.get(item.typeId) ?? String(item.typeId),
    },
    {
      key: "size",
      header: "Groesse",
      width: pixel(96),
      sortable: true,
      resizable: false,
    },
    {
      key: "location",
      header: "Standort",
      width: proportional(1),
      sortable: true,
      resizable: false,
      renderCell: (item) =>
        item.locationId != null
          ? (locationNameById.get(item.locationId) ?? "-")
          : "-",
    },
    {
      key: "createdAt",
      header: "Erstellt am",
      width: pixel(130),
      sortable: true,
      resizable: false,
      renderCell: (item) => <FormattedDate value={item.metaData.createdAt} />,
    },
    {
      key: "actions",
      header: "Aktionen",
      width: pixel(112),
      align: "end",
      resizable: false,
      renderCell: (item) => <ClothingItemActions item={item} />,
    },
  ]

  return (
    <div className="space-y-3">
      <TableToolbar
        searchLabel="Suchen"
        searchPlaceholder="Suchen..."
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        columnOptions={ITEM_COLUMN_OPTIONS}
        activeColumnKeys={columnSettings.activeColumnKeys}
        onChangeActiveColumnKeys={columnSettings.setActiveColumnKeys}
      />
      <Table
        data={sortedData}
        columns={columns}
        idKey="id"
        plugins={{ sort: sortPlugin, columnSettings: columnSettingsPlugin }}
        emptyState={
          <EmptyState title="Keine Kleidungsstuecke gefunden." isCompact />
        }
      />
    </div>
  )
}

interface ClothingItemActionsProps {
  item: ClothingItem
}

function ClothingItemActions({ item }: ClothingItemActionsProps) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const { mutate: deleteItem } = useMutation(
    deleteClothingItemMutation(queryClient),
  )

  function handleDelete() {
    deleteItem(item.id, {
      onSuccess: () => setIsDeleteDialogOpen(false),
    })
  }

  return (
    <HStack gap={1} hAlign="end">
      <IconButton
        label={`Kleidungsstueck ${item.id} bearbeiten`}
        tooltip="Bearbeiten"
        icon={<Pencil className="size-4" />}
        variant="secondary"
        size="lg"
        onClick={() => {
          void navigate({
            to: "/clothing-management/items/$clothingItemId/edit",
            params: { clothingItemId: String(item.id) },
          })
        }}
      />
      <IconButton
        label={`Kleidungsstueck ${item.id} löschen`}
        tooltip="Löschen"
        icon={<Trash2 className="size-4" />}
        variant="destructive"
        size="lg"
        onClick={() => setIsDeleteDialogOpen(true)}
      />
      <AlertDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Kleidungsstueck löschen"
        description={`Moechten Sie das Kleidungsstueck mit der ID ${item.id} wirklich löschen? Diese Aktion kann nicht rueckgaengig gemacht werden.`}
        actionLabel="Löschen"
        onAction={handleDelete}
        cancelLabel="Abbrechen"
        actionVariant="destructive"
      />
    </HStack>
  )
}
