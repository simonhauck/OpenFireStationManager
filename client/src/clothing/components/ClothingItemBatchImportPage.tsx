import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"
import { useState } from "react"

import type { components } from "#/api/schema"
import type { ClothingItem } from "#/clothing/service/clothingItemsQueries"
import { createBatchClothingItemsMutation } from "#/clothing/service/clothingItemsQueries"
import { useClothingTypes } from "#/clothing/service/clothingTypesQueries"
import ErrorState from "#/components/base/ErrorState"
import RoleGuard from "#/components/base/RoleGuard"
import { Button } from "#/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "#/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "#/components/ui/table"
import { Textarea } from "#/components/ui/textarea"

type CreateOrUpdateClothingItemRequest =
  components["schemas"]["CreateOrUpdateClothingItemRequest"]

interface ParsedRow {
  typeName: string
  size: string
  userIdentifier?: string
}

interface ParseResult {
  rows: ParsedRow[]
  errors: string[]
}

function parseCsv(csv: string): ParseResult {
  const lines = csv
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0)

  const rows: ParsedRow[] = []
  const errors: string[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const parts = line.split(",").map((p) => p.trim())

    if (parts.length < 2) {
      errors.push(
        `Zeile ${i + 1}: Mindestens zwei Spalten erwartet (Typ, Groesse).`,
      )
      continue
    }

    const [typeName, size, userIdentifier] = parts

    if (!typeName) {
      errors.push(`Zeile ${i + 1}: Kleidungstyp darf nicht leer sein.`)
      continue
    }

    if (!size) {
      errors.push(`Zeile ${i + 1}: Groesse darf nicht leer sein.`)
      continue
    }

    rows.push({
      typeName,
      size,
      userIdentifier,
    })
  }

  return { rows, errors }
}

export default function ClothingItemBatchImportPage() {
  return (
    <RoleGuard allowedRoles={["KLEIDERWART"]}>
      <ClothingItemBatchImportPageContent />
    </RoleGuard>
  )
}

function ClothingItemBatchImportPageContent() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [csvInput, setCsvInput] = useState("")
  const [parseErrors, setParseErrors] = useState<string[]>([])
  const [preview, setPreview] = useState<
    CreateOrUpdateClothingItemRequest[] | null
  >(null)

  const { data: clothingTypes } = useClothingTypes()

  const {
    mutate: createBatch,
    isPending,
    error: mutationError,
    data: createdItems,
  } = useMutation(createBatchClothingItemsMutation(queryClient))

  const typeNameToId = new Map(
    (clothingTypes ?? []).map((t) => [t.name.toLowerCase(), t.id]),
  )

  function handlePreview() {
    const { rows, errors } = parseCsv(csvInput)
    setParseErrors(errors)
    setPreview(null)

    if (errors.length > 0 || rows.length === 0) return

    const requests: CreateOrUpdateClothingItemRequest[] = []
    const resolveErrors: string[] = []

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const typeId = typeNameToId.get(row.typeName.toLowerCase())

      if (typeId === undefined) {
        resolveErrors.push(
          `Zeile ${i + 1}: Kleidungstyp "${row.typeName}" wurde nicht gefunden.`,
        )
        continue
      }

      requests.push({
        typeId,
        size: row.size,
        userIdentifier: row.userIdentifier,
      })
    }

    if (resolveErrors.length > 0) {
      setParseErrors(resolveErrors)
      return
    }

    setPreview(requests)
  }

  function handleSubmit() {
    if (!preview || preview.length === 0) return

    createBatch(preview, {
      onSuccess: () => {
        setCsvInput("")
        setPreview(null)
      },
    })
  }

  const typeIdToName = new Map((clothingTypes ?? []).map((t) => [t.id, t.name]))

  return (
    <main className="page-wrap px-4 py-12 space-y-6">
      <Card className="mx-auto w-full max-w-3xl">
        <CardHeader>
          <CardTitle>Massenimport von Kleidungsstuecken</CardTitle>
          <CardDescription>
            Importiere mehrere Kleidungsstuecke auf einmal. Gib die Daten im
            CSV-Format ein: <code>Typ,Groesse,Kennung</code>. Die Kennung ist
            optional.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <p className="text-sm font-medium">CSV-Eingabe</p>
            <Textarea
              placeholder={"Jacke,L,BARCODE001\nHose,M\nJacke,XL,BARCODE003"}
              rows={8}
              value={csvInput}
              onChange={(e) => {
                setCsvInput(e.target.value)
                setPreview(null)
                setParseErrors([])
              }}
            />
          </div>

          {parseErrors.length > 0 && (
            <ErrorState
              message={`Fehler in der Eingabe:\n${parseErrors.join("\n")}`}
            />
          )}

          <div className="flex justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={handlePreview}
              disabled={!csvInput.trim() || !clothingTypes}
            >
              Vorschau
            </Button>
          </div>

          {preview !== null && preview.length > 0 && !createdItems && (
            <>
              <p className="text-sm font-medium">
                Vorschau ({preview.length} Eintraege)
              </p>
              <PreviewTable items={preview} typeIdToName={typeIdToName} />

              {mutationError && (
                <ErrorState message="Die Kleidungsstuecke konnten nicht erstellt werden." />
              )}

              <div className="flex flex-wrap justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    void navigate({ to: "/klamottenmanagement/items" })
                  }
                >
                  Abbrechen
                </Button>
                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isPending}
                >
                  {isPending ? "Wird importiert..." : "Importieren"}
                </Button>
              </div>
            </>
          )}

          {createdItems && (
            <ImportSuccessResult
              items={createdItems}
              typeIdToName={typeIdToName}
              onDone={() => void navigate({ to: "/klamottenmanagement/items" })}
            />
          )}
        </CardContent>
      </Card>
    </main>
  )
}

interface PreviewTableProps {
  items: CreateOrUpdateClothingItemRequest[]
  typeIdToName: Map<number, string>
}

function PreviewTable({ items, typeIdToName }: PreviewTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Typ</TableHead>
          <TableHead>Groesse</TableHead>
          <TableHead>Kennung</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item, idx) => (
          <TableRow key={idx}>
            <TableCell>
              {typeIdToName.get(item.typeId) ?? String(item.typeId)}
            </TableCell>
            <TableCell>{item.size}</TableCell>
            <TableCell>{item.userIdentifier ?? "—"}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

interface ImportSuccessResultProps {
  items: ClothingItem[]
  typeIdToName: Map<number, string>
  onDone: () => void
}

function ImportSuccessResult({
  items,
  typeIdToName,
  onDone,
}: ImportSuccessResultProps) {
  return (
    <div className="space-y-4">
      <p className="text-sm font-medium text-green-600">
        {items.length} Kleidungsstueck(e) erfolgreich erstellt.
      </p>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Typ</TableHead>
            <TableHead>Groesse</TableHead>
            <TableHead>Kennung</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id}>
              <TableCell>{item.id}</TableCell>
              <TableCell>
                {typeIdToName.get(Number(item.typeId)) ?? String(item.typeId)}
              </TableCell>
              <TableCell>{item.size}</TableCell>
              <TableCell>{item.userIdentifier ?? "—"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="flex justify-end">
        <Button type="button" onClick={onDone}>
          Zur Uebersicht
        </Button>
      </div>
    </div>
  )
}
