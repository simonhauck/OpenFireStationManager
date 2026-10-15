export interface ParsedItemRow {
  size: string
  barcode?: string
  manufacturerBarcode?: string
}

export interface ParsedLocationRow {
  name: string
  comment: string
}

export interface CsvParseResult<T> {
  rows: T[]
  errors: string[]
}

function nonEmptyLines(csv: string): string[] {
  return csv
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
}

/**
 * Parses the batch-import CSV for clothing items: one `size,barcode,manufacturerBarcode` triple
 * per line. Both barcode columns are optional and may be left empty; an empty size is reported as
 * a per-line error. Existing two-column pastes keep working unchanged.
 */
export function parseClothingItemsCsv(
  csv: string,
): CsvParseResult<ParsedItemRow> {
  const rows: ParsedItemRow[] = []
  const errors: string[] = []

  const lines = nonEmptyLines(csv)
  for (let i = 0; i < lines.length; i++) {
    const [size, barcode, manufacturerBarcode] = lines[i]
      .split(",")
      .map((part) => part.trim())

    if (!size) {
      errors.push(`Zeile ${i + 1}: Größe darf nicht leer sein.`)
      continue
    }

    rows.push({ size, barcode, manufacturerBarcode })
  }

  return { rows, errors }
}

/**
 * Parses the batch-import CSV for clothing locations: one `name,comment` pair per line. The
 * comment column is optional (defaults to an empty string); an empty name is a per-line error.
 */
export function parseClothingLocationsCsv(
  csv: string,
): CsvParseResult<ParsedLocationRow> {
  const rows: ParsedLocationRow[] = []
  const errors: string[] = []

  const lines = nonEmptyLines(csv)
  for (let i = 0; i < lines.length; i++) {
    const [name, comment = ""] = lines[i].split(",").map((part) => part.trim())

    if (!name) {
      errors.push(`Zeile ${i + 1}: Bezeichnung darf nicht leer sein.`)
      continue
    }

    rows.push({ name, comment })
  }

  return { rows, errors }
}
