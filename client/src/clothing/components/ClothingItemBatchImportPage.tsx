import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"
import { useState } from "react"

import type { components } from "#/api/schema"
import type { ClothingItem } from "#/clothing/service/clothingItemsQueries"
import { createBatchClothingItemsMutation } from "#/clothing/service/clothingItemsQueries"
import { useClothingTypes } from "#/clothing/service/clothingTypesQueries"
import type { ClothingType } from "#/clothing/model/clothingType"
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
import { Label } from "#/components/ui/label"
import { RadioGroup, RadioGroupItem } from "#/components/ui/radio-group"
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
      errors.push(`Zeile ${i + 1}: Groesse darf nicht leer sein.`)
      continue
    }

    rows.push({ size, barcode })
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
  const [selectedTypeId, setSelectedTypeId] = useState<number | null>(null)
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

  const typeIdToName = new Map((clothingTypes ?? []).map((t) => [t.id, t.name]))

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

  function handleSubmit() {
    if (!preview || preview.length === 0) return

    createBatch(preview, {
      onSuccess: () => {
        setCsvInput("")
        setPreview(null)
      },
    })
  }

  return (
    <main className="page-wrap space-y-6 px-4 py-12">
      <Card className="mx-auto w-full max-w-3xl">
        <CardHeader>
          <CardTitle>Massenimport von Kleidungsstuecken</CardTitle>
          <CardDescription>
            Importiere mehrere Kleidungsstuecke auf einmal. Waehle zuerst einen
            Kleidungstyp, dann gib die Daten im CSV-Format ein:{" "}
            <code>Groesse,Barcode</code>. Der Barcode ist optional.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
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

          <RenderIf
            when={preview !== null && preview.length > 0 && !createdItems}
          >
            <BatchPreviewSection
              items={preview ?? []}
              typeIdToName={typeIdToName}
              isPending={isPending}
              hasError={mutationError !== null}
              onSubmit={handleSubmit}
              onCancel={() =>
                void navigate({ to: "/clothing-management/items" })
              }
            />
          </RenderIf>

          <RenderIf when={createdItems !== undefined}>
            <ImportSuccessResult
              items={createdItems ?? []}
              typeIdToName={typeIdToName}
              onDone={() => void navigate({ to: "/clothing-management/items" })}
            />
          </RenderIf>
        </CardContent>
      </Card>
    </main>
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
      <p className="text-sm font-medium">Schritt 1: Kleidungstyp auswaehlen</p>
      {clothingTypes.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Keine Kleidungstypen vorhanden.
        </p>
      ) : (
        <RadioGroup
          value={selectedTypeId !== null ? String(selectedTypeId) : undefined}
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
      )}
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
        <p className="text-sm italic">Example: L,ExampleBarcode1</p>
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
  typeIdToName: Map<number, string>
  isPending: boolean
  hasError: boolean
  onSubmit: () => void
  onCancel: () => void
}

function BatchPreviewSection({
  items,
  typeIdToName,
  isPending,
  hasError,
  onSubmit,
  onCancel,
}: BatchPreviewSectionProps) {
  return (
    <>
      <p className="text-sm font-medium">Vorschau ({items.length} Eintraege)</p>
      <PreviewTable items={items} typeIdToName={typeIdToName} />

      {hasError && (
        <ErrorState message="Die Kleidungsstuecke konnten nicht erstellt werden." />
      )}

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
          <TableHead>Barcode</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item, idx) => (
          <TableRow key={idx}>
            <TableCell>
              {typeIdToName.get(item.typeId) ?? String(item.typeId)}
            </TableCell>
            <TableCell>{item.size}</TableCell>
            <TableCell>{item.barcode ?? "—"}</TableCell>
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
            <TableHead>Barcode</TableHead>
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
              <TableCell>{item.barcode ?? "—"}</TableCell>
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
