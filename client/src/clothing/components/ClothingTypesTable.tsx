import { Link } from "@tanstack/react-router"
import { Pencil } from "lucide-react"

import type { ClothingType } from "#/clothing/model/clothingType"
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

interface ClothingTypesTableProps {
  types: ClothingType[]
}

export default function ClothingTypesTable({ types }: ClothingTypesTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>ID</TableHead>
          <TableHead>Typ</TableHead>
          <TableHead>Erstellt am</TableHead>
          <TableHead className="text-right">Aktionen</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {types.length === 0 ? (
          <TableRow>
            <TableCell colSpan={4}>Keine Kleidungstypen gefunden.</TableCell>
          </TableRow>
        ) : (
          types.map((type) => (
            <TableRow key={type.id}>
              <TableCell>{type.id}</TableCell>
              <TableCell>{type.name}</TableCell>
              <TableCell>
                <FormattedDate value={type.metaData.createdAt} />
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  <Button asChild size="icon" variant="outline">
                    <Link
                      to="/klamottenmanagement/types/$clothingTypeId/edit"
                      params={{ clothingTypeId: String(type.id) }}
                      aria-label={`Kleidungstyp ${type.name} bearbeiten`}
                      title="Kleidungstyp bearbeiten"
                    >
                      <Pencil className="size-4" />
                    </Link>
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  )
}
