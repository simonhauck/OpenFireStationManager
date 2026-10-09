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
import { useNavigate } from "@tanstack/react-router"
import { Pencil, Trash2 } from "lucide-react"
import { useState } from "react"

import DeleteClothingTypeDialog from "#/clothing/components/types/list/DeleteClothingTypeDialog"
import type { ClothingType } from "#/clothing/model/clothingType"
import FormattedDate from "#/components/base/FormattedDate"
import TableToolbar from "#/components/base/TableToolbar"

interface ClothingTypesTableProps {
  types: ClothingType[]
}

const TYPE_COLUMN_OPTIONS = [
  { key: "id", label: "ID" },
  { key: "name", label: "Typ", isAlwaysVisible: true },
  { key: "createdAt", label: "Erstellt am" },
  { key: "actions", label: "Aktionen", isAlwaysVisible: true },
]

const TYPE_COLUMN_KEYS = TYPE_COLUMN_OPTIONS.map((option) => option.key)

export default function ClothingTypesTable({ types }: ClothingTypesTableProps) {
  const [activeColumnKeys, setActiveColumnKeys] = useState<string[]>([
    ...TYPE_COLUMN_KEYS,
  ])

  const columnSettings = useTableColumnSettingsState({
    columns: TYPE_COLUMN_OPTIONS,
    activeColumnKeys,
    onChangeActiveColumnKeys: (keys) => setActiveColumnKeys([...keys]),
  })
  const columnSettingsPlugin = useTableColumnSettings<ClothingType>(
    columnSettings.columnSettingsConfig,
  )
  const { sortedData, sortConfig } = useTableSortableState<ClothingType>({
    data: types,
    defaultSort: [{ sortKey: "id", direction: "ascending" }],
    allowUnsortedState: false,
    comparators: {
      id: (a, b) => a.id - b.id,
      createdAt: (a, b) =>
        new Date(a.metaData.createdAt).getTime() -
        new Date(b.metaData.createdAt).getTime(),
    },
  })
  const sortPlugin = useTableSortable<ClothingType>(sortConfig)

  const columns: TableColumn<ClothingType>[] = [
    {
      key: "id",
      header: "ID",
      width: pixel(72),
      sortable: true,
      resizable: false,
    },
    {
      key: "name",
      header: "Typ",
      width: proportional(1),
      sortable: true,
      resizable: false,
    },
    {
      key: "createdAt",
      header: "Erstellt am",
      width: pixel(130),
      sortable: true,
      resizable: false,
      renderCell: (type) => <FormattedDate value={type.metaData.createdAt} />,
    },
    {
      key: "actions",
      header: "Aktionen",
      width: pixel(112),
      align: "end",
      resizable: false,
      renderCell: (type) => <ClothingTypeActions type={type} />,
    },
  ]

  return (
    <div className="space-y-3">
      <TableToolbar
        columnOptions={TYPE_COLUMN_OPTIONS}
        activeColumnKeys={columnSettings.activeColumnKeys}
        onChangeActiveColumnKeys={columnSettings.setActiveColumnKeys}
      />
      <Table
        data={sortedData}
        columns={columns}
        idKey="id"
        plugins={{ sort: sortPlugin, columnSettings: columnSettingsPlugin }}
        emptyState={
          <EmptyState title="Keine Kleidungstypen gefunden." isCompact />
        }
      />
    </div>
  )
}

interface ClothingTypeActionsProps {
  type: ClothingType
}

function ClothingTypeActions({ type }: ClothingTypeActionsProps) {
  const navigate = useNavigate()
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  return (
    <HStack gap={1} hAlign="end">
      <IconButton
        label={`Kleidungstyp ${type.name} bearbeiten`}
        tooltip="Bearbeiten"
        icon={<Pencil className="size-4" />}
        variant="secondary"
        size="lg"
        onClick={() => {
          void navigate({
            to: "/clothing-management/types/$clothingTypeId/edit",
            params: { clothingTypeId: String(type.id) },
          })
        }}
      />
      <IconButton
        label={`Kleidungstyp ${type.name} löschen`}
        tooltip="Löschen"
        icon={<Trash2 className="size-4" />}
        variant="destructive"
        size="lg"
        onClick={() => setIsDeleteDialogOpen(true)}
      />
      <DeleteClothingTypeDialog
        type={type}
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      />
    </HStack>
  )
}
