import { useNavigate } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { toast } from "sonner"
import { useRef, useState } from "react"

import { getAllClothingLocationsQuery } from "#/clothing/service/clothingLocationsQueries"
import { useCheckoutWizard } from "#/clothing/checkout/useCheckoutWizard"
import {
  getItemByBarcode,
  searchClothingItems,
} from "#/clothing/checkout/service/checkoutQueries"
import type { ResolvedClothingItem } from "#/clothing/checkout/autoToggleReturnsByType"
import {
  TouchButton,
  TouchCombobox,
} from "#/clothing/checkout/components/TouchComponents"
import type { ComboboxOption } from "#/clothing/checkout/components/TouchComponents"
import RenderIf from "#/components/base/RenderIf"
import { Input } from "#/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card"
import { Badge } from "#/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "#/components/ui/alert-dialog"

export default function CheckoutPage() {
  const { state, selectTarget, addItem, reset } = useCheckoutWizard()

  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Klamotten Ausgabe</h1>
        <TouchButton variant="outline" onClick={reset}>
          Abbrechen
        </TouchButton>
      </div>

      <RenderIf when={state.step === 1}>
        <StepTargetPicker onSelect={selectTarget} />
      </RenderIf>

      <RenderIf when={state.step === 2}>
        <StepItemScanner state={state} onAddItem={addItem} />
      </RenderIf>
    </div>
  )
}

// ─── Step 1: Target Picker ────────────────────────────────────────────────────

interface StepTargetPickerProps {
  onSelect: (locationId: number) => void
}

function StepTargetPicker({ onSelect }: StepTargetPickerProps) {
  const { data: allLocations } = useQuery(getAllClothingLocationsQuery())
  const [search, setSearch] = useState("")

  const personalLocations = (allLocations ?? []).filter(
    (l) => l.type === "PERSONAL",
  )

  const options: ComboboxOption[] = personalLocations.map((l) => ({
    value: String(l.id),
    label: l.name,
  }))

  const filteredOptions = options.filter((o) =>
    o.label.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>Schritt 1: Spind wählen</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground text-sm">
          Wähle den Spind (PERSONAL-Standort) aus, für den die Ausgabe erfolgt.
        </p>
        <TouchCombobox
          options={filteredOptions}
          value={null}
          onSelect={(value) => onSelect(Number(value))}
          placeholder="Spind auswählen..."
          searchPlaceholder="Spind suchen..."
          emptyMessage="Kein Spind gefunden."
        />
      </CardContent>
    </Card>
  )
}

// ─── Step 2: Item Scanner ─────────────────────────────────────────────────────

interface StepItemScannerProps {
  state: ReturnType<typeof useCheckoutWizard>["state"]
  onAddItem: (item: ResolvedClothingItem, isDiscrepant?: boolean) => void
}

interface PendingConfirmation {
  item: ResolvedClothingItem
  actualLocationName: string
}

function StepItemScanner({ state, onAddItem }: StepItemScannerProps) {
  const barcodeInputRef = useRef<HTMLInputElement>(null)
  const [barcodeValue, setBarcodeValue] = useState("")
  const [isScanning, setIsScanning] = useState(false)
  const [pendingConfirmation, setPendingConfirmation] =
    useState<PendingConfirmation | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<ResolvedClothingItem[]>([])

  async function handleBarcodeSubmit(barcode: string) {
    if (!barcode.trim()) return
    setBarcodeValue("")
    setIsScanning(true)
    try {
      const item = await getItemByBarcode(barcode.trim())
      handleScannedItem(item)
    } catch {
      toast.error(`Barcode nicht gefunden: ${barcode}`)
    } finally {
      setIsScanning(false)
      barcodeInputRef.current?.focus()
    }
  }

  function handleScannedItem(item: ResolvedClothingItem) {
    const alreadyInList = state.takeItems.some(
      (i) => i.clothingItem.id === item.clothingItem.id,
    )
    if (alreadyInList) return // silent ignore

    const location = item.location
    const isAtPool = location?.type === "POOL"

    if (!isAtPool) {
      // Not at a POOL — show confirmation dialog
      setPendingConfirmation({
        item,
        actualLocationName: location?.name ?? "Unbekannt",
      })
      return
    }

    onAddItem(item, false)
  }

  async function handleSearchSelect(value: string) {
    const found = searchResults.find((r) => String(r.clothingItem.id) === value)
    if (found) handleScannedItem(found)
  }

  async function handleSearchChange(q: string) {
    setSearchQuery(q)
    if (q.length < 2) {
      setSearchResults([])
      return
    }
    try {
      const results = await searchClothingItems(q)
      setSearchResults(results)
    } catch {
      // silent — search is a backup, not critical
    }
  }

  const searchOptions: ComboboxOption[] = searchResults.map((r) => ({
    value: String(r.clothingItem.id),
    label: `${r.clothingType.name} ${r.clothingItem.size}${r.clothingItem.barcode ? ` (${r.clothingItem.barcode})` : ""}`,
  }))

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Schritt 2: Kleidung scannen</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground text-sm">
            Scanne einen Barcode oder suche manuell nach einem Kleidungsstück.
          </p>

          {/* Primary: barcode scanner input */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Barcode scannen</label>
            <Input
              ref={barcodeInputRef}
              value={barcodeValue}
              onChange={(e) => setBarcodeValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  void handleBarcodeSubmit(barcodeValue)
                }
              }}
              placeholder="Barcode eingeben / Scanner verwenden..."
              className="h-12 text-base"
              disabled={isScanning}
              autoFocus
            />
          </div>

          {/* Backup: searchable combobox */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Oder manuell suchen</label>
            <TouchCombobox
              options={searchOptions}
              value={null}
              onSelect={handleSearchSelect}
              onSearchChange={(q) => void handleSearchChange(q)}
              placeholder="Kleidungsstück suchen..."
              searchPlaceholder="Typ, Größe oder Barcode..."
              emptyMessage={
                searchQuery.length < 2
                  ? "Mindestens 2 Zeichen eingeben..."
                  : "Keine Ergebnisse."
              }
            />
          </div>

          {/* Item list */}
          <RenderIf when={state.takeItems.length > 0}>
            <div className="space-y-2">
              <p className="text-sm font-medium">
                Ausgewählte Kleidung ({state.takeItems.length})
              </p>
              <div className="space-y-2">
                {state.takeItems.map((item) => (
                  <div
                    key={item.clothingItem.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <span className="text-base">
                      {item.clothingType.name} – {item.clothingItem.size}
                    </span>
                    <RenderIf
                      when={state.discrepantItemIds.has(item.clothingItem.id)}
                    >
                      <Badge variant="outline" className="text-amber-600">
                        Abweichend
                      </Badge>
                    </RenderIf>
                  </div>
                ))}
              </div>
            </div>
          </RenderIf>
        </CardContent>
      </Card>

      {/* Discrepancy confirmation dialog */}
      <AlertDialog
        open={pendingConfirmation !== null}
        onOpenChange={(open) => {
          if (!open) setPendingConfirmation(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Kleidungsstück nicht im Pool</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingConfirmation && (
                <>
                  Dieses Kleidungsstück befindet sich laut System bei{" "}
                  <strong>{pendingConfirmation.actualLocationName}</strong>,
                  nicht in einem Pool. Trotzdem hinzufügen?
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => setPendingConfirmation(null)}
              className="min-h-12"
            >
              Abbrechen
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingConfirmation) {
                  onAddItem(pendingConfirmation.item, true)
                  setPendingConfirmation(null)
                }
              }}
              className="min-h-12"
            >
              Trotzdem hinzufügen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
