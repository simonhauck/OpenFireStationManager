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
import type { ResolvedClothingItem } from "#/clothing/model/clothingItems"
import { deleteClothingItemMutation } from "#/clothing/service/clothingItemsQueries"
import FormattedDate from "#/components/base/FormattedDate"
import TableToolbar from "#/components/base/TableToolbar"
import { useClientPagination } from "#/components/base/useClientPagination"
import { formatDate } from "#/lib/date"
import MemberName from "#/members/components/shared/MemberName"
import { useMemberNameLookup } from "#/members/service/memberQueries"

interface ClothingItemsTableProps {
  items: ResolvedClothingItem[]
}

type ClothingItemRow = ResolvedClothingItem & {
  memberName?: string
}

const ITEM_COLUMN_OPTIONS = [
  { key: "id", label: "ID" },
  { key: "barcode", label: "Barcode" },
  { key: "manufacturerBarcode", label: "Hersteller-Barcode" },
  { key: "type", label: "Typ", isAlwaysVisible: true },
  { key: "size", label: "Größe" },
  { key: "location", label: "Standort" },
  { key: "member", label: "Mitglied" },
  { key: "createdAt", label: "Erstellt am" },
  { key: "actions", label: "Aktionen", isAlwaysVisible: true },
]

const ITEM_COLUMN_KEYS = ITEM_COLUMN_OPTIONS.map((option) => option.key)

export default function ClothingItemsTable({ items }: ClothingItemsTableProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [activeColumnKeys, setActiveColumnKeys] = useState<string[]>([
    ...ITEM_COLUMN_KEYS,
  ])
  const lookupMemberName = useMemberNameLookup()

  const columnSettings = useTableColumnSettingsState({
    columns: ITEM_COLUMN_OPTIONS,
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
    defaultSort: [{ sortKey: "id", direction: "descending" }],
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
      renderCell: (item) => item.clothingType.name,
    },
    {
      key: "size",
      header: "Größe",
      width: pixel(96),
      sortable: true,
      resizable: false,
      renderCell: (item) => item.clothingItem.size,
    },
    {
      key: "location",
      header: "Standort",
      width: proportional(1),
      sortable: true,
      resizable: false,
      renderCell: (item) => item.location?.name ?? "-",
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
        searchLabel="Suchen"
        searchPlaceholder="Suchen..."
        searchValue={searchTerm}
        onSearchChange={(term) => {
          setSearchTerm(term)
          resetPage()
        }}
        columnOptions={ITEM_COLUMN_OPTIONS}
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
        emptyState={
          <EmptyState title="Keine Kleidungsstücke gefunden." isCompact />
        }
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
