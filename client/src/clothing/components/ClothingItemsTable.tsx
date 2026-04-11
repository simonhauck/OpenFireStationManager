import { Link } from "@tanstack/react-router"

import type { ClothingType } from "#/clothing/model/clothingType"
import type { ClothingItem } from "#/clothing/service/clothingItemsQueries"
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
          <TableHead></TableHead>
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
              <TableCell>
                <Button variant="outline" size="sm" asChild>
                  <Link
                    to="/clothing-management/items/$clothingItemId/edit"
                    params={{ clothingItemId: String(item.id) }}
                  >
                    Bearbeiten
                  </Link>
                </Button>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  )
}
