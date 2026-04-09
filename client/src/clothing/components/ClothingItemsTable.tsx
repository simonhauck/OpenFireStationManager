import type { ClothingType } from "#/clothing/model/clothingType"
import type { ClothingItem } from "#/clothing/service/clothingItemsQueries"
import FormattedDate from "#/components/base/FormattedDate"
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
          <TableHead>Kennung</TableHead>
          <TableHead>Typ</TableHead>
          <TableHead>Groesse</TableHead>
          <TableHead>Erstellt am</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.length === 0 ? (
          <TableRow>
            <TableCell colSpan={5}>Keine Kleidungsstuecke gefunden.</TableCell>
          </TableRow>
        ) : (
          items.map((item) => (
            <TableRow key={item.id}>
              <TableCell>{item.id}</TableCell>
              <TableCell>{item.userIdentifier ?? "—"}</TableCell>
              <TableCell>
                {typeNameById.get(String(item.typeId)) ?? String(item.typeId)}
              </TableCell>
              <TableCell>{item.size}</TableCell>
              <TableCell>
                <FormattedDate value={item.metaData.createdAt} />
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  )
}
