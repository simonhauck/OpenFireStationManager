import type { ClothingLocation } from "#/clothing/service/clothingLocationsQueries"
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
  locations: ClothingLocation[]
}

export default function ClothingItemsTable({
  items,
  types,
  locations,
}: ClothingItemsTableProps) {
  const typeNameById = new Map(
    types.map((type) => [String(type.id), type.name]),
  )

  const locationById = new Map(locations.map((loc) => [String(loc.id), loc]))

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>ID</TableHead>
          <TableHead>Typ</TableHead>
          <TableHead>Groesse</TableHead>
          <TableHead>Lagerort</TableHead>
          <TableHead>Kommentar</TableHead>
          <TableHead>Erstellt am</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.length === 0 ? (
          <TableRow>
            <TableCell colSpan={6}>Keine Kleidungsstuecke gefunden.</TableCell>
          </TableRow>
        ) : (
          items.map((item) => {
            const location = item.locationId
              ? locationById.get(String(item.locationId))
              : undefined
            return (
              <TableRow key={item.id}>
                <TableCell>{item.id}</TableCell>
                <TableCell>
                  {typeNameById.get(String(item.typeId)) ?? String(item.typeId)}
                </TableCell>
                <TableCell>{item.size}</TableCell>
                <TableCell>{location?.name ?? "-"}</TableCell>
                <TableCell>{location?.comment ?? "-"}</TableCell>
                <TableCell>
                  <FormattedDate value={item.metaData.createdAt} />
                </TableCell>
              </TableRow>
            )
          })
        )}
      </TableBody>
    </Table>
  )
}
