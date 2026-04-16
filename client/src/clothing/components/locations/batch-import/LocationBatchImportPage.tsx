import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"
import { useState } from "react"

import type {
  ClothingLocation,
  CreateClothingLocationRequest,
} from "#/clothing/service/clothingLocationsQueries"
import { createClothingLocationMutation } from "#/clothing/service/clothingLocationsQueries"
import ErrorState from "#/components/base/ErrorState"
import RenderIf from "#/components/base/RenderIf"
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

interface ParsedRow {
  name: string
  comment: string
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

    const [name, comment = ""] = parts

    if (!name) {
      errors.push(`Zeile ${i + 1}: Bezeichnung darf nicht leer sein.`)
      continue
    }

    rows.push({ name, comment })
  }

  return { rows, errors }
}

export default function LocationBatchImportPage() {
  return (
    <RoleGuard allowedRoles={["KLEIDERWART"]}>
      <LocationBatchImportPageContent />
    </RoleGuard>
  )
}

function LocationBatchImportPageContent() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [csvInput, setCsvInput] = useState("")
  const [parseErrors, setParseErrors] = useState<string[]>([])
  const [preview, setPreview] = useState<
    CreateClothingLocationRequest[] | null
  >(null)
  const [createdLocations, setCreatedLocations] = useState<
    ClothingLocation[] | null
  >(null)

  const { mutateAsync: createLocation, isPending } = useMutation(
    createClothingLocationMutation(queryClient),
  )

  const [mutationError, setMutationError] = useState<Error | null>(null)

  function handlePreview() {
    const { rows, errors } = parseCsv(csvInput)
    setParseErrors(errors)
    setPreview(null)

    if (errors.length > 0 || rows.length === 0) return

    const requests: CreateClothingLocationRequest[] = rows.map((row) => ({
      name: row.name,
      comment: row.comment,
      onlyVisibleForKleiderwart: false,
      shouldBeShownOnDashboard: false,
    }))

    setPreview(requests)
  }

  async function handleSubmit() {
    if (!preview || preview.length === 0) return

    setMutationError(null)

    try {
      const results = await Promise.all(
        preview.map((req) => createLocation(req)),
      )
      setCreatedLocations(results)
      setCsvInput("")
      setPreview(null)
    } catch (err) {
      setMutationError(err instanceof Error ? err : new Error(String(err)))
    }
  }

  return (
    <main className="page-wrap space-y-6 px-4 py-12">
      <Card className="mx-auto w-full max-w-3xl">
        <CardHeader>
          <CardTitle>Massenimport von Standorten</CardTitle>
          <CardDescription>
            Importiere mehrere Standorte auf einmal. Gib die Daten im CSV-Format
            ein: <code>Bezeichnung,Kommentar</code>. Der Kommentar ist optional.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <RenderIf when={createdLocations === null}>
            <CsvInputSection
              value={csvInput}
              onChange={(val) => {
                setCsvInput(val)
                setPreview(null)
                setParseErrors([])
              }}
              onPreview={handlePreview}
              disabled={!csvInput.trim()}
            />
          </RenderIf>

          <RenderIf when={parseErrors.length > 0}>
            <ErrorState
              message={`Fehler in der Eingabe:\n${parseErrors.join("\n")}`}
            />
          </RenderIf>

          <RenderIf
            when={
              preview !== null &&
              preview.length > 0 &&
              createdLocations === null
            }
          >
            <BatchPreviewSection
              items={preview ?? []}
              isPending={isPending}
              hasError={mutationError !== null}
              onSubmit={() => void handleSubmit()}
              onCancel={() =>
                void navigate({ to: "/clothing-management/locations" })
              }
            />
          </RenderIf>

          <RenderIf when={createdLocations !== null}>
            <ImportSuccessResult
              locations={createdLocations ?? []}
              onDone={() =>
                void navigate({ to: "/clothing-management/locations" })
              }
            />
          </RenderIf>
        </CardContent>
      </Card>
    </main>
  )
}

interface CsvInputSectionProps {
  value: string
  onChange: (value: string) => void
  onPreview: () => void
  disabled: boolean
}

function CsvInputSection({
  value,
  onChange,
  onPreview,
  disabled,
}: CsvInputSectionProps) {
  return (
    <>
      <div className="space-y-1.5">
        <p className="text-sm font-medium">CSV-Daten eingeben</p>
        <p className="text-sm italic">Beispiel: Schrank A,Hauptgebaeude EG</p>
        <Textarea
          placeholder={"Schrank A,Hauptgebaeude EG\nRegal B\nSpind 3,Umkleide"}
          rows={8}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>

      <div className="flex justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={onPreview}
          disabled={disabled}
        >
          Vorschau
        </Button>
      </div>
    </>
  )
}

interface BatchPreviewSectionProps {
  items: CreateClothingLocationRequest[]
  isPending: boolean
  hasError: boolean
  onSubmit: () => void
  onCancel: () => void
}

function BatchPreviewSection({
  items,
  isPending,
  hasError,
  onSubmit,
  onCancel,
}: BatchPreviewSectionProps) {
  return (
    <>
      <p className="text-sm font-medium">Vorschau ({items.length} Eintraege)</p>
      <PreviewTable items={items} />

      <RenderIf when={hasError}>
        <ErrorState message="Die Standorte konnten nicht erstellt werden." />
      </RenderIf>

      <div className="flex flex-wrap justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Abbrechen
        </Button>
        <Button type="button" onClick={onSubmit} disabled={isPending}>
          {isPending ? "Wird importiert..." : "Importieren"}
        </Button>
      </div>
    </>
  )
}

interface PreviewTableProps {
  items: CreateClothingLocationRequest[]
}

function PreviewTable({ items }: PreviewTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Bezeichnung</TableHead>
          <TableHead>Kommentar</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item, idx) => (
          <TableRow key={idx}>
            <TableCell>{item.name}</TableCell>
            <TableCell>{item.comment || "—"}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

interface ImportSuccessResultProps {
  locations: ClothingLocation[]
  onDone: () => void
}

function ImportSuccessResult({ locations, onDone }: ImportSuccessResultProps) {
  return (
    <div className="space-y-4">
      <p className="text-sm font-medium text-green-600">
        {locations.length} Standort(e) erfolgreich erstellt.
      </p>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Bezeichnung</TableHead>
            <TableHead>Kommentar</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {locations.map((location) => (
            <TableRow key={location.id}>
              <TableCell>{location.id}</TableCell>
              <TableCell>{location.name}</TableCell>
              <TableCell>{location.comment || "—"}</TableCell>
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
