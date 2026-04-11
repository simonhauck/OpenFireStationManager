import { Link } from "@tanstack/react-router"
import { ArrowDown, ArrowUp, ArrowUpDown, Pencil } from "lucide-react"

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

export type SortKey = "id" | "barcode" | "type" | "size" | "createdAt"
export type SortDirection = "asc" | "desc"

interface ClothingItemsTableProps {
  items: ClothingItem[]
  types: ClothingType[]
  sortKey: SortKey
  sortDir: SortDirection
  onSort: (key: SortKey) => void
}

function SortIcon({
  column,
  sortKey,
  sortDir,
}: {
  column: SortKey
  sortKey: SortKey
  sortDir: SortDirection
}) {
  if (column !== sortKey)
    return <ArrowUpDown className="ml-1 inline size-3 opacity-50" />
  if (sortDir === "asc") return <ArrowUp className="ml-1 inline size-3" />
  return <ArrowDown className="ml-1 inline size-3" />
}

export default function ClothingItemsTable({
  items,
  types,
  sortKey,
  sortDir,
  onSort,
}: ClothingItemsTableProps) {
  const typeNameById = new Map(
    types.map((type) => [String(type.id), type.name]),
  )

  function SortableHead({
    column,
    children,
    className,
  }: {
    column: SortKey
    children: React.ReactNode
    className?: string
  }) {
    return (
      <TableHead className={className}>
        <button
          type="button"
          className="flex cursor-pointer items-center font-medium"
          onClick={() => onSort(column)}
        >
          {children}
          <SortIcon column={column} sortKey={sortKey} sortDir={sortDir} />
        </button>
      </TableHead>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <SortableHead column="id">ID</SortableHead>
          <SortableHead column="barcode">Barcode</SortableHead>
          <SortableHead column="type">Typ</SortableHead>
          <SortableHead column="size">Groesse</SortableHead>
          <SortableHead column="createdAt">Erstellt am</SortableHead>
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
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  )
}
