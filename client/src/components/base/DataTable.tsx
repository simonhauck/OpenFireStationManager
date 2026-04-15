import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react"
import type { ChangeEvent, ReactNode } from "react"
import { useMemo, useState } from "react"

import RenderIf from "#/components/base/RenderIf"
import { Badge } from "#/components/ui/badge"
import { Input } from "#/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "#/components/ui/table"
import { formatDate } from "#/lib/date"

type DataTablePrimitiveValue = string | number | Date

export type DataTableListValue = DataTablePrimitiveValue[]

export type DataTableCellValue = DataTablePrimitiveValue | DataTableListValue

export type DataTableColumn<TRow> = {
  id: string
  header: string
  getValue: (row: TRow) => DataTableCellValue
}

export type DataTableActionColumnProps<TRow> = {
  row: TRow
  rowIndex: number
  originalRowIndex: number
}

export type DataTableActionRenderer<TRow> = (
  props: DataTableActionColumnProps<TRow>,
) => ReactNode

type IndexedRow<TRow> = {
  row: TRow
  originalRowIndex: number
}

type DataTableProps<TRow> = {
  rows: TRow[]
  columns: DataTableColumn<TRow>[]
  actionHeader?: string
  actionColumn?: DataTableActionRenderer<TRow>
  emptyMessage?: string
  showSearch?: boolean
  searchPlaceholder?: string
}

type SortDirection = "asc" | "desc"

function valueForSortingPrimitive(
  value: DataTablePrimitiveValue,
): string | number {
  if (value instanceof Date) {
    return value.getTime()
  }

  if (typeof value === "number") {
    return value
  }

  return value.toLowerCase()
}

function valueForSorting(value: DataTableCellValue): string | number {
  if (Array.isArray(value)) {
    return value
      .map((item: DataTablePrimitiveValue) =>
        String(valueForSortingPrimitive(item)).toLowerCase(),
      )
      .join("|")
  }

  return valueForSortingPrimitive(value)
}

function formatPrimitiveCellValue(value: DataTablePrimitiveValue): string {
  if (value instanceof Date) {
    return formatDate(value) ?? "-"
  }

  return String(value)
}

function renderCellValue(value: DataTableCellValue): ReactNode {
  if (Array.isArray(value)) {
    return (
      <div className="flex flex-wrap gap-1">
        {value.map((item: DataTablePrimitiveValue, itemIndex: number) => (
          <Badge key={`${itemIndex}-${String(item)}`} variant="secondary">
            {formatPrimitiveCellValue(item)}
          </Badge>
        ))}
      </div>
    )
  }

  return formatPrimitiveCellValue(value)
}

function valueMatchesSearch(value: DataTableCellValue, term: string): boolean {
  if (Array.isArray(value)) {
    return value.some((item: DataTablePrimitiveValue) =>
      formatPrimitiveCellValue(item).toLowerCase().includes(term),
    )
  }

  return formatPrimitiveCellValue(value).toLowerCase().includes(term)
}

function SortIcon({
  isSorted,
  direction,
}: {
  isSorted: boolean
  direction: SortDirection
}) {
  if (!isSorted) {
    return <ArrowUpDown className="ml-1 inline size-3 opacity-50" />
  }

  if (direction === "asc") {
    return <ArrowUp className="ml-1 inline size-3" />
  }

  return <ArrowDown className="ml-1 inline size-3" />
}

export default function DataTable<TRow>({
  rows,
  columns,
  actionHeader = "Aktionen",
  actionColumn,
  emptyMessage = "Keine Daten vorhanden.",
  showSearch = true,
  searchPlaceholder = "Suchen...",
}: DataTableProps<TRow>) {
  const [sortColumnIndex, setSortColumnIndex] = useState(0)
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc")
  const [searchTerm, setSearchTerm] = useState("")

  const hasActionColumn = actionColumn !== undefined
  const columnCount = columns.length + (hasActionColumn ? 1 : 0)

  const normalizedSearchTerms = searchTerm
    .split(",")
    .map((term: string) => term.trim().toLowerCase())
    .filter((term: string) => term.length > 0)

  const filteredRows = useMemo<IndexedRow<TRow>[]>(() => {
    const rowsWithIndex: IndexedRow<TRow>[] = rows.map(
      (row: TRow, originalRowIndex: number) => ({ row, originalRowIndex }),
    )

    if (normalizedSearchTerms.length === 0) {
      return rowsWithIndex
    }

    return rowsWithIndex.filter(({ row }: IndexedRow<TRow>) => {
      return normalizedSearchTerms.every((term: string) =>
        columns.some((column: DataTableColumn<TRow>) =>
          valueMatchesSearch(column.getValue(row), term),
        ),
      )
    })
  }, [columns, normalizedSearchTerms, rows])

  const sortedRows = useMemo<IndexedRow<TRow>[]>(() => {
    const sortColumn = columns[sortColumnIndex]

    return filteredRows.toSorted((a: IndexedRow<TRow>, b: IndexedRow<TRow>) => {
      const aValue = sortColumn.getValue(a.row)
      const bValue = sortColumn.getValue(b.row)

      const normalizedA = valueForSorting(aValue)
      const normalizedB = valueForSorting(bValue)

      if (normalizedA < normalizedB) {
        return sortDirection === "asc" ? -1 : 1
      }

      if (normalizedA > normalizedB) {
        return sortDirection === "asc" ? 1 : -1
      }

      return 0
    })
  }, [columns, filteredRows, sortColumnIndex, sortDirection])

  function handleSort(columnIndex: number): void {
    if (columnIndex === sortColumnIndex) {
      setSortDirection((current: SortDirection) =>
        current === "asc" ? "desc" : "asc",
      )
      return
    }

    setSortColumnIndex(columnIndex)
    setSortDirection("asc")
  }

  function handleSearchChange(event: ChangeEvent<HTMLInputElement>): void {
    setSearchTerm(event.target.value)
  }

  function renderAction(
    row: TRow,
    rowIndex: number,
    originalRowIndex: number,
  ): ReactNode {
    if (actionColumn === undefined) {
      return null
    }

    return actionColumn({ row, rowIndex, originalRowIndex })
  }

  return (
    <div className="space-y-3">
      <RenderIf when={showSearch}>
        <Input
          placeholder={searchPlaceholder}
          value={searchTerm}
          onChange={handleSearchChange}
        />
      </RenderIf>

      <Table>
        <TableHeader>
          <TableRow>
            {columns.map(
              (column: DataTableColumn<TRow>, columnIndex: number) => (
                <TableHead key={column.id}>
                  <button
                    type="button"
                    className="flex cursor-pointer items-center font-medium"
                    onClick={() => handleSort(columnIndex)}
                  >
                    {column.header}
                    <SortIcon
                      isSorted={columnIndex === sortColumnIndex}
                      direction={sortDirection}
                    />
                  </button>
                </TableHead>
              ),
            )}
            <RenderIf when={hasActionColumn}>
              <TableHead className="text-right">{actionHeader}</TableHead>
            </RenderIf>
          </TableRow>
        </TableHeader>
        <TableBody>
          <RenderIf when={sortedRows.length === 0}>
            <TableRow>
              <TableCell colSpan={columnCount}>{emptyMessage}</TableCell>
            </TableRow>
          </RenderIf>

          <RenderIf when={sortedRows.length > 0}>
            {sortedRows.map(
              (
                { row, originalRowIndex }: IndexedRow<TRow>,
                rowIndex: number,
              ) => (
                <TableRow key={String(originalRowIndex)}>
                  {columns.map(
                    (column: DataTableColumn<TRow>, columnIndex: number) => (
                      <TableCell
                        key={`${rowIndex}-${column.id}-${columnIndex}`}
                      >
                        {renderCellValue(column.getValue(row))}
                      </TableCell>
                    ),
                  )}
                  <RenderIf when={hasActionColumn}>
                    <TableCell className="text-right">
                      {renderAction(row, rowIndex, originalRowIndex)}
                    </TableCell>
                  </RenderIf>
                </TableRow>
              ),
            )}
          </RenderIf>
        </TableBody>
      </Table>
    </div>
  )
}
