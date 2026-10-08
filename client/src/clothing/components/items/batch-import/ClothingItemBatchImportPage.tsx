import { Button } from "@astryxdesign/core/Button"
import { Card } from "@astryxdesign/core/Card"
import { EmptyState } from "@astryxdesign/core/EmptyState"
import { RadioList, RadioListItem } from "@astryxdesign/core/RadioList"
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
import type { CreateOrUpdateClothingItemRequest } from "#/clothing/model/clothingItems"
import type { ClothingType } from "#/clothing/model/clothingType"
import type { ClothingItem } from "#/clothing/service/clothingItemsQueries"
import { createBatchClothingItemsMutation } from "#/clothing/service/clothingItemsQueries"
import { useClothingTypes } from "#/clothing/service/clothingTypesQueries"
import ErrorState from "#/components/base/ErrorState"
import PageSection from "#/components/base/PageSection"
import RenderIf from "#/components/base/RenderIf"
import RoleGuard from "#/components/base/RoleGuard"

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

const previewColumns: TableColumn<CreateOrUpdateClothingItemRequest>[] = [
  {
    key: "typeId",
    header: "Typ-ID",
    width: pixel(96),
  },
  {
    key: "size",
    header: "Größe",
    width: proportional(1),
  },
  {
    key: "barcode",
    header: "Barcode",
    width: proportional(1),
    renderCell: (item) => item.barcode || "—",
  },
]

const resultColumns: TableColumn<ClothingItem>[] = [
  {
    key: "id",
    header: "ID",
    width: pixel(96),
  },
  {
    key: "typeId",
    header: "Typ-ID",
    width: pixel(96),
  },
  {
    key: "size",
    header: "Größe",
    width: proportional(1),
  },
  {
    key: "barcode",
    header: "Barcode",
    width: proportional(1),
    renderCell: (item) => item.barcode || "—",
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
      <Card maxWidth={768} className="mx-auto w-full">
        <div className="space-y-6">
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
        </div>
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
        <RadioList
          label="Kleidungstyp"
          isRequired
          value={selectedTypeId !== null ? String(selectedTypeId) : ""}
          onChange={(value) => onSelect(Number(value))}
        >
          {clothingTypes.map((type) => (
            <RadioListItem
              key={type.id}
              value={String(type.id)}
              label={type.name}
            />
          ))}
        </RadioList>
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
          <br />
          Format:{" "}
          <code>
            Größe<sup>*</sup>,Barcode
          </code>
          <br />
        </p>
        <p className="text-sm italic">Beispiel: L,ExampleBarcode1</p>
        <TextArea
          label="CSV-Daten"
          placeholder={"L,BARCODE001\nM\nXL,BARCODE003"}
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
      <Table
        data={items}
        columns={previewColumns}
        emptyState={<EmptyState title="Keine Einträge vorhanden." isCompact />}
      />

      <RenderIf when={hasError}>
        <ErrorState message="Die Kleidungsstücke konnten nicht erstellt werden." />
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
  items: ClothingItem[]
  onDone: () => void
}

function ImportSuccessResult({ items, onDone }: ImportSuccessResultProps) {
  return (
    <div className="space-y-4">
      <p className="text-sm font-medium text-green-600">
        {items.length} Kleidungsstück(e) erfolgreich erstellt.
      </p>
      <Table
        data={items}
        columns={resultColumns}
        idKey="id"
        emptyState={
          <EmptyState title="Keine Kleidungsstücke erstellt." isCompact />
        }
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
