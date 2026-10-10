import { Button } from "@astryxdesign/core/Button"
import { Card } from "@astryxdesign/core/Card"
import { EmptyState } from "@astryxdesign/core/EmptyState"
import { Selector } from "@astryxdesign/core/Selector"
import {
  pixel,
  proportional,
  Table,
  type TableColumn,
} from "@astryxdesign/core/Table"
import { TextArea } from "@astryxdesign/core/TextArea"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"
import { useState } from "react"

import type {
  ClothingLocation,
  CreateClothingLocationRequest,
  LocationType,
} from "#/clothing/model/clothingLocations"
import { batchCreateClothingLocationsMutation } from "#/clothing/service/clothingLocationsQueries"
import ErrorState from "#/components/base/ErrorState"
import PageSection from "#/components/base/PageSection"
import RenderIf from "#/components/base/RenderIf"
import RoleGuard from "#/components/base/RoleGuard"

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

const previewColumns: TableColumn<CreateClothingLocationRequest>[] = [
  {
    key: "name",
    header: "Bezeichnung",
    width: proportional(1),
  },
  {
    key: "comment",
    header: "Kommentar",
    width: proportional(1),
    renderCell: (item) => item.comment || "—",
  },
  {
    key: "type",
    header: "Typ",
    width: pixel(160),
    renderCell: (item) => LOCATION_TYPE_LABELS[item.type],
  },
]

const resultColumns: TableColumn<ClothingLocation>[] = [
  {
    key: "id",
    header: "ID",
    width: pixel(96),
  },
  {
    key: "name",
    header: "Bezeichnung",
    width: proportional(1),
  },
  {
    key: "comment",
    header: "Kommentar",
    width: proportional(1),
    renderCell: (location) => location.comment || "—",
  },
  {
    key: "type",
    header: "Typ",
    width: pixel(160),
    renderCell: (location) => LOCATION_TYPE_LABELS[location.type],
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
    <PageSection
      title="Massenimport von Standorten"
      subtitle="Erstelle mehrere Standorte in einem Schritt. Die Daten werden im CSV-Format angegeben."
    >
      <Card maxWidth={768} className="mx-auto w-full">
        <div className="space-y-6">
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
        </div>
      </Card>
    </PageSection>
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
      <Selector
        label="Standorttyp"
        options={Object.entries(LOCATION_TYPE_LABELS).map(([type, label]) => ({
          value: type,
          label,
        }))}
        value={locationType}
        onChange={(type) => onLocationTypeChange(type as LocationType)}
        width="100%"
      />

      <div className="space-y-1.5">
        <p className="text-sm font-medium">CSV-Daten eingeben</p>
        <p className="text-muted-foreground text-sm">
          Gib die weiteren Parameter im CSV-Format ein. Werte mit{" "}
          <code>
            <sup>*</sup>
          </code>{" "}
          sind Pflichtfelder. <br />
          Format:{" "}
          <code>
            Bezeichnung<sup>*</sup>,Kommentar
          </code>
          <br />
        </p>
        <p className="text-sm italic">Beispiel: Schrank A,Hauptgebäude EG</p>
        <TextArea
          label="CSV-Daten"
          placeholder={"Schrank A,Hauptgebäude EG\nRegal B\nSpind 3,Umkleide"}
          rows={8}
          value={value}
          onChange={onChange}
        />
      </div>

      <div className="flex justify-end">
        <Button
          type="button"
          label="Vorschau"
          variant="secondary"
          onClick={onPreview}
          isDisabled={disabled}
        />
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
      <p className="text-sm font-medium">Vorschau ({items.length} Einträge)</p>
      <Table
        data={items}
        columns={previewColumns}
        emptyState={<EmptyState title="Keine Einträge vorhanden." isCompact />}
      />

      <RenderIf when={hasError}>
        <ErrorState message="Die Standorte konnten nicht erstellt werden." />
      </RenderIf>

      <div className="flex flex-wrap justify-end gap-2 pt-2">
        <Button
          type="button"
          label="Abbrechen"
          variant="secondary"
          onClick={onCancel}
        />
        <Button
          type="button"
          label={isPending ? "Wird importiert..." : "Importieren"}
          variant="primary"
          onClick={onSubmit}
          isLoading={isPending}
        />
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
      <Table
        data={locations}
        columns={resultColumns}
        idKey="id"
        emptyState={<EmptyState title="Keine Standorte erstellt." isCompact />}
      />
      <div className="flex justify-end">
        <Button
          type="button"
          label="Zur Übersicht"
          variant="primary"
          onClick={onDone}
        />
      </div>
    </div>
  )
}
