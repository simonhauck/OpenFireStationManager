import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"
import { useState } from "react"

import type { ClothingItem } from "#/clothing/service/clothingItemsQueries"
import { createBatchClothingItemsMutation } from "#/clothing/service/clothingItemsQueries"
import { useClothingTypes } from "#/clothing/service/clothingTypesQueries"
import type { ClothingType } from "#/clothing/model/clothingType"
import type { CreateOrUpdateClothingItemRequest } from "#/clothing/model/clothingItems"
import DataTable from "#/components/base/DataTable"
import type { DataTableColumn } from "#/components/base/DataTable"
import ErrorState from "#/components/base/ErrorState"
import PageSection from "#/components/base/PageSection"
import RenderIf from "#/components/base/RenderIf"
import RoleGuard from "#/components/base/RoleGuard"
import { Button } from "#/components/ui/button"
import { Card, CardContent } from "#/components/ui/card"
import { Label } from "#/components/ui/label"
import { RadioGroup, RadioGroupItem } from "#/components/ui/radio-group"
import { Textarea } from "#/components/ui/textarea"

interface ParsedRow {
  size: string
  barcode?: string
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

    const [size, barcode] = parts

    if (!size) {
      errors.push(`Zeile ${i + 1}: Größe darf nicht leer sein.`)
      continue
    }

    rows.push({ size, barcode })
  }

  return { rows, errors }
}

const previewColumns: DataTableColumn<CreateOrUpdateClothingItemRequest>[] = [
  {
    id: "typeId",
    header: "Typ-ID",
    getValue: (item) => item.typeId,
  },
  {
    id: "size",
    header: "Größe",
    getValue: (item) => item.size,
  },
  {
    id: "barcode",
    header: "Barcode",
    getValue: (item) => item.barcode || "—",
  },
]

const resultColumns: DataTableColumn<ClothingItem>[] = [
  {
    id: "id",
    header: "ID",
    getValue: (item) => item.id,
  },
  {
    id: "typeId",
    header: "Typ-ID",
    getValue: (item) => item.typeId,
  },
  {
    id: "size",
    header: "Größe",
    getValue: (item) => item.size,
  },
  {
    id: "barcode",
    header: "Barcode",
    getValue: (item) => item.barcode || "—",
  },
]

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
  const [selectedTypeId, setSelectedTypeId] = useState<number | null>(null)
  const [csvInput, setCsvInput] = useState("")
  const [parseErrors, setParseErrors] = useState<string[]>([])
  const [preview, setPreview] = useState<
    CreateOrUpdateClothingItemRequest[] | null
  >(null)
  const [createdItems, setCreatedItems] = useState<ClothingItem[] | null>(null)
  const [mutationError, setMutationError] = useState<Error | null>(null)

  const { data: clothingTypes } = useClothingTypes()

  const { mutateAsync: createBatch, isPending } = useMutation(
    createBatchClothingItemsMutation(queryClient),
  )

  function handlePreview() {
    if (selectedTypeId === null) return

    const { rows, errors } = parseCsv(csvInput)
    setParseErrors(errors)
    setPreview(null)

    if (errors.length > 0 || rows.length === 0) return

    const requests: CreateOrUpdateClothingItemRequest[] = rows.map((row) => ({
      typeId: selectedTypeId,
      size: row.size,
      barcode: row.barcode,
    }))

    setPreview(requests)
  }

  async function handleSubmit() {
    if (!preview || preview.length === 0) return

    setMutationError(null)

    try {
      const results = await createBatch(preview)
      setCreatedItems(results)
      setCsvInput("")
      setPreview(null)
    } catch (err) {
      setMutationError(err instanceof Error ? err : new Error(String(err)))
    }
  }

  return (
    <PageSection
      title="Massenimport von Kleidungsstücken"
      subtitle="Importiere mehrere Kleidungsstücke auf einmal. Wähle zuerst einen Kleidungstyp, dann gib die CSV-Daten ein."
    >
      <Card className="mx-auto w-full max-w-3xl">
        <CardContent className="space-y-6 pt-6">
          <RenderIf when={createdItems === null}>
            <TypeSelectionSection
              clothingTypes={clothingTypes ?? []}
              selectedTypeId={selectedTypeId}
              onSelect={(id) => {
                setSelectedTypeId(id)
                setPreview(null)
                setParseErrors([])
              }}
            />

            <RenderIf when={selectedTypeId !== null}>
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

            <RenderIf when={preview !== null && preview.length > 0}>
              <BatchPreviewSection
                items={preview ?? []}
                isPending={isPending}
                hasError={mutationError !== null}
                onSubmit={() => void handleSubmit()}
                onCancel={() =>
                  void navigate({ to: "/clothing-management/items" })
                }
              />
            </RenderIf>
          </RenderIf>

          <RenderIf when={createdItems !== null}>
            <ImportSuccessResult
              items={createdItems ?? []}
              onDone={() => void navigate({ to: "/clothing-management/items" })}
            />
          </RenderIf>
        </CardContent>
      </Card>
    </PageSection>
  )
}

interface TypeSelectionSectionProps {
  clothingTypes: ClothingType[]
  selectedTypeId: number | null
  onSelect: (id: number) => void
}

function TypeSelectionSection({
  clothingTypes,
  selectedTypeId,
  onSelect,
}: TypeSelectionSectionProps) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">Schritt 1: Kleidungstyp auswählen</p>
      <RenderIf when={clothingTypes.length === 0}>
        <p className="text-muted-foreground text-sm">
          Keine Kleidungstypen vorhanden.
        </p>
      </RenderIf>
      <RenderIf when={clothingTypes.length > 0}>
        <RadioGroup
          value={selectedTypeId !== null ? String(selectedTypeId) : ""}
          onValueChange={(val) => onSelect(Number(val))}
          className="grid grid-cols-2 gap-2 sm:grid-cols-3"
        >
          {clothingTypes.map((type) => (
            <div key={type.id} className="flex items-center gap-2">
              <RadioGroupItem value={String(type.id)} id={`type-${type.id}`} />
              <Label htmlFor={`type-${type.id}`}>{type.name}</Label>
            </div>
          ))}
        </RadioGroup>
      </RenderIf>
    </div>
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
        <p className="text-sm font-medium">Schritt 2: CSV-Daten eingeben</p>
        <p className="text-muted-foreground text-sm">
          Gib die weiteren Parameter im CSV-Format ein. Werte mit{" "}
          <code>
            <sup>*</sup>
          </code>{" "}
          sind Pflichtfelder.
          <br></br>
          Format:{" "}
          <code>
            Größe<sup>*</sup>,Barcode
          </code>
          <br></br>
        </p>
        <p className="text-sm italic">Beispiel: L,ExampleBarcode1</p>
        <Textarea
          placeholder={"L,BARCODE001\nM\nXL,BARCODE003"}
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
  items: CreateOrUpdateClothingItemRequest[]
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
      <DataTable
        columns={previewColumns}
        rows={items}
        showSearch={false}
        emptyMessage="Keine Einträge vorhanden."
      />

      <RenderIf when={hasError}>
        <ErrorState message="Die Kleidungsstücke konnten nicht erstellt werden." />
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
  items: ClothingItem[]
  onDone: () => void
}

function ImportSuccessResult({ items, onDone }: ImportSuccessResultProps) {
  return (
    <div className="space-y-4">
      <p className="text-sm font-medium text-green-600">
        {items.length} Kleidungsstück(e) erfolgreich erstellt.
      </p>
      <DataTable
        columns={resultColumns}
        rows={items}
        showSearch={false}
        emptyMessage="Keine Kleidungsstücke erstellt."
      />
      <div className="flex justify-end">
        <Button type="button" onClick={onDone}>
          Zur Übersicht
        </Button>
      </div>
    </div>
  )
}
