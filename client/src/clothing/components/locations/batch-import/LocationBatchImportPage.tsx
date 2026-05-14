import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"
import { useState } from "react"

import type {
  ClothingLocation,
  CreateClothingLocationRequest,
  LocationType,
} from "#/clothing/service/clothingLocationsQueries"
import { batchCreateClothingLocationsMutation } from "#/clothing/service/clothingLocationsQueries"
import ClearableSelect from "#/components/base/ClearableSelect"
import DataTable from "#/components/base/DataTable"
import type { DataTableColumn } from "#/components/base/DataTable"
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
import { Textarea } from "#/components/ui/textarea"

const LOCATION_TYPE_LABELS: Record<LocationType, string> = {
  POOL: "Pool",
  WAESCHE: "Wäsche",
  PERSONAL: "Persönlicher Standort",
  OTHER: "Sonstiges",
}

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

const previewColumns: DataTableColumn<CreateClothingLocationRequest>[] = [
  {
    id: "name",
    header: "Bezeichnung",
    getValue: (item) => item.name,
  },
  {
    id: "comment",
    header: "Kommentar",
    getValue: (item) => item.comment || "—",
  },
  {
    id: "type",
    header: "Typ",
    getValue: (item) => LOCATION_TYPE_LABELS[item.type],
  },
]

const resultColumns: DataTableColumn<ClothingLocation>[] = [
  {
    id: "id",
    header: "ID",
    getValue: (location) => location.id,
  },
  {
    id: "name",
    header: "Bezeichnung",
    getValue: (location) => location.name,
  },
  {
    id: "comment",
    header: "Kommentar",
    getValue: (location) => location.comment || "—",
  },
  {
    id: "type",
    header: "Typ",
    getValue: (location) => LOCATION_TYPE_LABELS[location.type],
  },
]

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
  const [locationType, setLocationType] = useState<LocationType>("POOL")
  const [parseErrors, setParseErrors] = useState<string[]>([])
  const [preview, setPreview] = useState<
    CreateClothingLocationRequest[] | null
  >(null)
  const [createdLocations, setCreatedLocations] = useState<
    ClothingLocation[] | null
  >(null)

  const { mutateAsync: createBatchLocations, isPending } = useMutation(
    batchCreateClothingLocationsMutation(queryClient),
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
      type: locationType,
    }))

    setPreview(requests)
  }

  async function handleSubmit() {
    if (!preview || preview.length === 0) return

    setMutationError(null)

    try {
      const results = await createBatchLocations({ items: preview })
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
            Importiere mehrere Standorte auf einmal. Alle importierten Standorte
            erhalten den ausgewählten Typ.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <RenderIf when={createdLocations === null}>
            <CsvInputSection
              value={csvInput}
              locationType={locationType}
              onLocationTypeChange={setLocationType}
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
  locationType: LocationType
  onLocationTypeChange: (type: LocationType) => void
  onChange: (value: string) => void
  onPreview: () => void
  disabled: boolean
}

function CsvInputSection({
  value,
  locationType,
  onLocationTypeChange,
  onChange,
  onPreview,
  disabled,
}: CsvInputSectionProps) {
  return (
    <>
      <ClearableSelect<LocationType>
        id="location-type"
        label="Standorttyp"
        noItemSelectedLabel="Typ auswählen"
        canClear={false}
        options={Object.keys(LOCATION_TYPE_LABELS) as LocationType[]}
        selectedValue={locationType}
        onValueChange={(v) => {
          if (v) onLocationTypeChange(v)
        }}
        toDisplayString={(type) => LOCATION_TYPE_LABELS[type]}
      />

      <div className="space-y-1.5">
        <p className="text-sm font-medium">CSV-Daten eingeben</p>
        <p className="text-sm text-muted-foreground">
          Gib die Daten im CSV-Format ein: <code>Bezeichnung,Kommentar</code>.
          Der Kommentar ist optional.
        </p>
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
      <DataTable
        columns={previewColumns}
        rows={items}
        showSearch={false}
        emptyMessage="Keine Eintraege vorhanden."
      />

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
      <DataTable
        columns={resultColumns}
        rows={locations}
        showSearch={false}
        emptyMessage="Keine Standorte erstellt."
      />
      <div className="flex justify-end">
        <Button type="button" onClick={onDone}>
          Zur Uebersicht
        </Button>
      </div>
    </div>
  )
}
