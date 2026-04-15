import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import { Pencil, Trash2 } from "lucide-react"

import type { ClothingType } from "#/clothing/model/clothingType"
import type { ClothingItem } from "#/clothing/service/clothingItemsQueries"
import { deleteClothingItemMutation } from "#/clothing/service/clothingItemsQueries"
import DeleteDialogComponent from "#/components/base/DeleteDialogComponent"
import FormattedDate from "#/components/base/FormattedDate"
import { Button } from "#/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "#/components/ui/table"

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

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>ID</TableHead>
          <TableHead>Barcode</TableHead>
          <TableHead>Typ</TableHead>
          <TableHead>Groesse</TableHead>
          <TableHead>Erstellt am</TableHead>
          <TableHead className="text-right"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.length === 0 ? (
          <TableRow>
            <TableCell colSpan={6}>Keine Kleidungsstuecke gefunden.</TableCell>
          </TableRow>
        ) : (
          items.map((item) => (
            <TableRow key={item.id}>
              <TableCell>{item.id}</TableCell>
              <TableCell>{item.barcode ?? "—"}</TableCell>
              <TableCell>
                {typeNameById.get(String(item.typeId)) ?? String(item.typeId)}
              </TableCell>
              <TableCell>{item.size}</TableCell>
              <TableCell>
                <FormattedDate value={item.metaData.createdAt} />
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
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
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  )
}
