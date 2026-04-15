import { Link } from "@tanstack/react-router"
import { Pencil, Trash2 } from "lucide-react"

import type { ClothingType } from "#/clothing/model/clothingType"
import { deleteClothingItemMutation } from "#/clothing/service/clothingItemsQueries"
import type { ClothingItem } from "#/clothing/service/clothingItemsQueries"
import DataTable from "#/components/base/DataTable"
import type { DataTableColumn } from "#/components/base/DataTable"
import { Button } from "#/components/ui/button"
import DeleteDialogComponent from "#/components/base/DeleteDialogComponent.tsx"
import { useMutation, useQueryClient } from "@tanstack/react-query"

interface ClothingItemsTableProps {
  items: ClothingItem[]
  types: ClothingType[]
}

export default function ClothingItemsTable({
  items,
  types,
}: ClothingItemsTableProps) {
  const queryClient = useQueryClient()
  const { mutate: deleteItem } = useMutation(
    deleteClothingItemMutation(queryClient),
  )

  const typeNameById = new Map(
    types.map((type) => [String(type.id), type.name]),
  )

  const columns: DataTableColumn<ClothingItem>[] = [
    {
      id: "id",
      header: "ID",
      getValue: (item: ClothingItem) => item.id,
    },
    {
      id: "barcode",
      header: "Barcode",
      getValue: (item: ClothingItem) => item.barcode ?? "-",
    },
    {
      id: "type",
      header: "Typ",
      getValue: (item: ClothingItem) =>
        typeNameById.get(String(item.typeId)) ?? String(item.typeId),
    },
    {
      id: "size",
      header: "Groesse",
      getValue: (item: ClothingItem) => item.size,
    },
    {
      id: "createdAt",
      header: "Erstellt am",
      getValue: (item: ClothingItem) => new Date(item.metaData.createdAt),
    },
  ]

  return (
    <DataTable
      columns={columns}
      rows={items}
      showSearch={true}
      actionColumn={({ row: item }) => {
        return (
          <div className=" flex justify-end gap-1">
            <Button asChild size="icon" variant="outline">
              <Link
                to="/clothing-management/items/$clothingItemId/edit"
                params={{ clothingItemId: String(item.id) }}
                aria-label={`Kleidungsstueck ${item.id} bearbeiten`}
                title="Bearbeiten"
              >
                <Pencil className="size-4" />
              </Link>
            </Button>

            <DeleteDialogComponent
              onDelete={() => deleteItem(item.id)}
              headline="Kleidungsstueck loeschen"
              bodyText={`Moechten Sie das Kleidungsstueck mit der ID ${item.id} wirklich loeschen? Diese Aktion kann nicht rueckgaengig gemacht werden.`}
            >
              <Button
                size="icon"
                variant="outline"
                aria-label={`Kleidungsstueck ${item.id} loeschen`}
                title="Loeschen"
              >
                <Trash2 className="size-4" />
              </Button>
            </DeleteDialogComponent>
          </div>
        )
      }}
      emptyMessage="Keine Kleidungsstuecke gefunden."
    />
  )
}
