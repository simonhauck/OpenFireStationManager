import { AlertDialog } from "@astryxdesign/core/AlertDialog"
import { EmptyState } from "@astryxdesign/core/EmptyState"
import { HStack } from "@astryxdesign/core/HStack"
import { IconButton } from "@astryxdesign/core/IconButton"
import { Link } from "@astryxdesign/core/Link"
import {
  pixel,
  proportional,
  Table,
  type TableColumn,
  type TableSortState,
  useTableColumnSettings,
  useTableColumnSettingsState,
  useTableSortable,
  useTableSortableState,
} from "@astryxdesign/core/Table"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"
import { Pencil, Trash2 } from "lucide-react"
import { useMemo, useState } from "react"
import LocationName from "#/clothing/components/shared/LocationName"
import type { ResolvedClothingItem } from "#/clothing/model/clothingItems"
import { deleteClothingItemMutation } from "#/clothing/service/clothingItemsQueries"
import FormattedDate from "#/components/base/FormattedDate"
import TableToolbar from "#/components/base/TableToolbar"
import { useClientPagination } from "#/components/base/useClientPagination"
import { formatDate } from "#/lib/date"
import MemberName from "#/members/components/shared/MemberName"
import { useMemberNameLookup } from "#/members/service/memberQueries"

export type ClothingItemColumnKey =
  | "id"
  | "barcode"
  | "manufacturerBarcode"
  | "type"
  | "size"
  | "location"
  | "member"
  | "createdAt"
  | "actions"

interface ClothingItemsTableProps {
  items: ResolvedClothingItem[]
  columnKeys?: ReadonlyArray<ClothingItemColumnKey>
  linkItemLabels?: boolean
  searchLabel?: string
  searchPlaceholder?: string
  emptyStateTitle?: string
  defaultSort?: TableSortState
}

type ClothingItemRow = ResolvedClothingItem & {
  memberName?: string
}

const ITEM_COLUMN_LABELS: Record<ClothingItemColumnKey, string> = {
  id: "ID",
  barcode: "Barcode",
  manufacturerBarcode: "Hersteller-Barcode",
  type: "Typ",
  size: "Größe",
  location: "Standort",
  member: "Mitglied",
  createdAt: "Erstellt am",
  actions: "Aktionen",
}

const ITEM_COLUMN_KEYS: ReadonlyArray<ClothingItemColumnKey> = [
  "id",
  "barcode",
  "manufacturerBarcode",
  "type",
  "size",
  "location",
  "member",
  "createdAt",
  "actions",
]

const ALWAYS_VISIBLE_COLUMN_KEYS: ReadonlySet<ClothingItemColumnKey> = new Set([
  "type",
  "actions",
])

const DEFAULT_SORT: TableSortState = [
  { sortKey: "id", direction: "descending" },
]

export default function ClothingItemsTable({
  items,
  columnKeys = ITEM_COLUMN_KEYS,
  linkItemLabels = false,
  searchLabel = "Suchen",
  searchPlaceholder = "Suchen...",
  emptyStateTitle = "Keine Kleidungsstücke gefunden.",
  defaultSort = DEFAULT_SORT,
}: ClothingItemsTableProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [activeColumnKeys, setActiveColumnKeys] = useState<string[]>([
    ...columnKeys,
  ])
  const lookupMemberName = useMemberNameLookup()

  const columnOptions = columnKeys.map((key) => ({
    key,
    label: ITEM_COLUMN_LABELS[key],
    isAlwaysVisible: ALWAYS_VISIBLE_COLUMN_KEYS.has(key),
  }))

  const columnSettings = useTableColumnSettingsState({
    columns: columnOptions,
    activeColumnKeys,
    onChangeActiveColumnKeys: (keys) => setActiveColumnKeys([...keys]),
  })
  const columnSettingsPlugin = useTableColumnSettings<ClothingItemRow>(
    columnSettings.columnSettingsConfig,
  )

  const rows = useMemo<ClothingItemRow[]>(
    () =>
      items.map((item) => ({
        ...item,
        memberName: lookupMemberName(item.location?.memberId),
      })),
    [items, lookupMemberName],
  )

  const filteredItems = useMemo(() => {
    const terms = searchTerm
      .toLowerCase()
      .split(",")
      .map((term) => term.trim())
      .filter((term) => term.length > 0)

    if (terms.length === 0) {
      return rows
    }

    return rows.filter((item) => {
      const haystack = [
        String(item.clothingItem.id),
        item.clothingItem.barcode ?? "-",
        item.clothingItem.manufacturerBarcode ?? "-",
        item.clothingType.name,
        item.clothingItem.size,
        item.location?.name ?? "-",
        item.memberName ?? "",
        formatDate(item.clothingItem.metaData.createdAt) ?? "-",
      ]
        .join(" ")
        .toLowerCase()

      return terms.every((term) => haystack.includes(term))
    })
  }, [rows, searchTerm])

  const { sortedData, sortConfig } = useTableSortableState<ClothingItemRow>({
    data: filteredItems,
    defaultSort,
    allowUnsortedState: false,
    comparators: {
      id: (a, b) => a.clothingItem.id - b.clothingItem.id,
      barcode: (a, b) =>
        (a.clothingItem.barcode ?? "").localeCompare(
          b.clothingItem.barcode ?? "",
        ),
      manufacturerBarcode: (a, b) =>
        (a.clothingItem.manufacturerBarcode ?? "").localeCompare(
          b.clothingItem.manufacturerBarcode ?? "",
        ),
      type: (a, b) => a.clothingType.name.localeCompare(b.clothingType.name),
      size: (a, b) => a.clothingItem.size.localeCompare(b.clothingItem.size),
      location: (a, b) =>
        (a.location?.name ?? "").localeCompare(b.location?.name ?? ""),
      member: (a, b) => (a.memberName ?? "").localeCompare(b.memberName ?? ""),
      createdAt: (a, b) =>
        new Date(a.clothingItem.metaData.createdAt).getTime() -
        new Date(b.clothingItem.metaData.createdAt).getTime(),
    },
  })
  const sortPlugin = useTableSortable<ClothingItemRow>(sortConfig)

  const { pageData, paginationPlugin, rowIndexStart, rowCount, resetPage } =
    useClientPagination(sortedData)

  const columns: TableColumn<ClothingItemRow>[] = [
    {
      key: "id",
      header: "ID",
      width: pixel(72),
      sortable: true,
      resizable: false,
      renderCell: (item) => item.clothingItem.id,
    },
    {
      key: "barcode",
      header: "Barcode",
      width: proportional(1),
      sortable: true,
      resizable: false,
      renderCell: (item) => item.clothingItem.barcode ?? "-",
    },
    {
      key: "manufacturerBarcode",
      header: "Hersteller-Barcode",
      width: proportional(1),
      sortable: true,
      resizable: false,
      renderCell: (item) => item.clothingItem.manufacturerBarcode ?? "-",
    },
    {
      key: "type",
      header: "Typ",
      width: proportional(1),
      sortable: true,
      resizable: false,
      renderCell: (item) =>
        linkItemLabels ? (
          <Link
            href={`/clothing-management/items/${item.clothingItem.id}/edit`}
          >
            {item.clothingType.name}
          </Link>
        ) : (
          item.clothingType.name
        ),
    },
    {
      key: "size",
      header: "Größe",
      width: pixel(96),
      sortable: true,
      resizable: false,
      renderCell: (item) =>
        linkItemLabels ? (
          <Link
            href={`/clothing-management/items/${item.clothingItem.id}/edit`}
          >
            {item.clothingItem.size}
          </Link>
        ) : (
          item.clothingItem.size
        ),
    },
    {
      key: "location",
      header: "Standort",
      width: proportional(1),
      sortable: true,
      resizable: false,
      renderCell: (item) => (
        <LocationName
          locationId={item.location?.id}
          name={item.location?.name}
        />
      ),
    },
    {
      key: "member",
      header: "Mitglied",
      width: proportional(1),
      sortable: true,
      resizable: false,
      renderCell: (item) => (
        <MemberName memberId={item.location?.memberId} name={item.memberName} />
      ),
    },
    {
      key: "createdAt",
      header: "Erstellt am",
      width: pixel(130),
      sortable: true,
      resizable: false,
      renderCell: (item) => (
        <FormattedDate value={item.clothingItem.metaData.createdAt} />
      ),
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
        searchLabel={searchLabel}
        searchPlaceholder={searchPlaceholder}
        searchValue={searchTerm}
        onSearchChange={(term) => {
          setSearchTerm(term)
          resetPage()
        }}
        columnOptions={columnOptions}
        activeColumnKeys={columnSettings.activeColumnKeys}
        onChangeActiveColumnKeys={columnSettings.setActiveColumnKeys}
      />
      <Table
        data={pageData}
        columns={columns}
        idKey={(item) => item.clothingItem.id}
        rowIndexStart={rowIndexStart}
        rowCount={rowCount}
        plugins={{
          sort: sortPlugin,
          columnSettings: columnSettingsPlugin,
          pagination: paginationPlugin,
        }}
        emptyState={<EmptyState title={emptyStateTitle} isCompact />}
      />
    </div>
  )
}

interface ClothingItemActionsProps {
  item: ResolvedClothingItem
}

function ClothingItemActions({ item }: ClothingItemActionsProps) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const { mutate: deleteItem } = useMutation(
    deleteClothingItemMutation(queryClient),
  )

  const itemId = item.clothingItem.id

  function handleDelete() {
    deleteItem(itemId, {
      onSuccess: () => setIsDeleteDialogOpen(false),
    })
  }

  return (
    <HStack gap={1} hAlign="end">
      <IconButton
        label={`Kleidungsstück ${itemId} bearbeiten`}
        tooltip="Bearbeiten"
        icon={<Pencil className="size-4" />}
        variant="secondary"
        size="lg"
        onClick={() => {
          void navigate({
            to: "/clothing-management/items/$clothingItemId/edit",
            params: { clothingItemId: String(itemId) },
          })
        }}
      />
      <IconButton
        label={`Kleidungsstück ${itemId} löschen`}
        tooltip="Löschen"
        icon={<Trash2 className="size-4" />}
        variant="destructive"
        size="lg"
        onClick={() => setIsDeleteDialogOpen(true)}
      />
      <AlertDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Kleidungsstück löschen"
        description={`Möchten Sie das Kleidungsstück mit der ID ${itemId} wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.`}
        actionLabel="Löschen"
        onAction={handleDelete}
        cancelLabel="Abbrechen"
        actionVariant="destructive"
      />
    </HStack>
  )
}
