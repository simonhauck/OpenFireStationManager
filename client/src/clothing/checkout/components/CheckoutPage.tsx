import { useMutation, useQuery } from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"
import { toast } from "sonner"
import { useEffect, useRef, useState } from "react"
import { Trash2Icon } from "lucide-react"

import { getAllClothingLocationsQuery } from "#/clothing/service/clothingLocationsQueries"
import { getAllClothingItemsQuery } from "#/clothing/service/clothingItemsQueries"
import { getAllClothingTypesQuery } from "#/clothing/service/clothingTypesQueries"
import { useCheckoutWizard } from "#/clothing/checkout/useCheckoutWizard"
import type { CheckoutStep } from "#/clothing/checkout/useCheckoutWizard"
import {
  getItemByBarcode,
  searchClothingItems,
  checkoutMutation,
} from "#/clothing/checkout/service/checkoutQueries"
import type { ResolvedClothingItem } from "#/clothing/checkout/autoToggleReturnsByType"
import { autoToggleReturnsByType } from "#/clothing/checkout/autoToggleReturnsByType"
import {
  TouchButton,
  TouchCombobox,
} from "#/clothing/checkout/components/TouchComponents"
import type { ComboboxOption } from "#/clothing/checkout/components/TouchComponents"
import { VerticalStepper } from "#/components/base/VerticalStepper"
import type { Step } from "#/components/base/VerticalStepper"
import RenderIf from "#/components/base/RenderIf"
import { Input } from "#/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card"
import { Badge } from "#/components/ui/badge"
import { Checkbox } from "#/components/ui/checkbox"
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
import type { components } from "#/api/schema"

type ClothingLocation = components["schemas"]["ClothingLocation"]

const CHECKOUT_STEPS: Step[] = [
  { label: "Spind wählen", description: "PERSONAL-Standort auswählen" },
  {
    label: "Kleidung scannen",
    description: "Barcode scannen oder manuell suchen",
  },
  {
    label: "Rückgabe wählen",
    description: "Kleidung aus dem Spind zurückgeben",
  },
  { label: "Wäsche-Ziel wählen", description: "Ziel-Wäschekorb auswählen" },
  { label: "Überprüfen", description: "Ausgabe und Rückgabe prüfen" },
  { label: "Bestätigen", description: "Vorgang abschließen" },
]

export default function CheckoutPage() {
  const navigate = useNavigate()
  const {
    state,
    selectTarget,
    addItem,
    removeItem,
    advanceToReturns,
    setReturnItemIds,
    toggleReturnItem,
    confirmReturns,
    selectWashLocation,
    submitOk,
    goBack,
    goToStep,
    reset,
  } = useCheckoutWizard()

  return (
    <div className="p-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-2xl">Klamotten Ausgabe</CardTitle>
          <TouchButton
            variant="outline"
            onClick={() => {
              navigate({ to: "/pool-klamotten" })
            }}
          >
            Abbrechen
          </TouchButton>
        </CardHeader>
        <div className="flex items-stretch">
          {/* Stepper sidebar — hidden on mobile */}
          <aside className="hidden shrink-0 sm:block">
            <div className="px-6 pb-6">
              <VerticalStepper
                steps={CHECKOUT_STEPS}
                currentStep={state.step}
                onStepClick={(n) => {
                  if (state.step === 6) return
                  goToStep(n as CheckoutStep)
                }}
              />
            </div>
          </aside>

          {/* Step content */}
          <div className="min-w-0 flex-1 space-y-4 px-6 pb-6">
            <RenderIf when={state.step === 1}>
              <StepTargetPicker onSelect={selectTarget} />
            </RenderIf>

            <RenderIf when={state.step === 2}>
              <StepItemScanner
                state={state}
                onAddItem={addItem}
                onRemoveItem={removeItem}
                onBack={goBack}
                onNext={advanceToReturns}
              />
            </RenderIf>

            <RenderIf when={state.step === 3}>
              <StepReturnToggles
                state={state}
                onSetReturnItemIds={setReturnItemIds}
                onToggleReturnItem={toggleReturnItem}
                onBack={goBack}
                onConfirm={confirmReturns}
              />
            </RenderIf>

            <RenderIf when={state.step === 4}>
              <StepWashLocationPicker onSelect={selectWashLocation} />
            </RenderIf>

            <RenderIf when={state.step === 5}>
              <StepReview
                state={state}
                onSubmitOk={submitOk}
                onBack={goBack}
                onReset={reset}
              />
            </RenderIf>

            <RenderIf when={state.step === 6}>
              <StepSuccess
                onReset={reset}
                onNavigateToOverview={() =>
                  void navigate({ to: "/pool-klamotten" })
                }
              />
            </RenderIf>
          </div>
        </div>
      </Card>
    </div>
  )
}

// ─── Step 1: Target Picker ────────────────────────────────────────────────────

interface StepTargetPickerProps {
  onSelect: (locationId: number) => void
}

function StepTargetPicker({ onSelect }: StepTargetPickerProps) {
  const { data: allLocations } = useQuery(getAllClothingLocationsQuery())
  const [search] = useState("")

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
  onRemoveItem: (itemId: number) => void
  onBack: () => void
  onNext: () => void
}

interface PendingConfirmation {
  item: ResolvedClothingItem
  actualLocationName: string
}

function StepItemScanner({
  state,
  onAddItem,
  onRemoveItem,
  onBack,
  onNext,
}: StepItemScannerProps) {
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
                    <div className="flex items-center gap-2">
                      <RenderIf
                        when={state.discrepantItemIds.has(item.clothingItem.id)}
                      >
                        <Badge variant="outline" className="text-amber-600">
                          Nicht in Pool
                        </Badge>
                      </RenderIf>
                      <TouchButton
                        variant="ghost"
                        size="icon"
                        aria-label={`${item.clothingType.name} entfernen`}
                        onClick={() => onRemoveItem(item.clothingItem.id)}
                        className="text-destructive hover:text-destructive size-10 shrink-0"
                      >
                        <Trash2Icon className="size-4" />
                      </TouchButton>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </RenderIf>

          {/* Weiter button */}
          <div className="flex justify-end gap-3 pt-2">
            <TouchButton variant="outline" onClick={onBack}>
              ← Zurück
            </TouchButton>
            <TouchButton
              disabled={state.takeItems.length === 0}
              onClick={onNext}
            >
              Weiter →
            </TouchButton>
          </div>
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

// ─── Step 3: Return Toggles ───────────────────────────────────────────────────

interface StepReturnTogglesProps {
  state: ReturnType<typeof useCheckoutWizard>["state"]
  onSetReturnItemIds: (ids: Set<number>) => void
  onToggleReturnItem: (itemId: number) => void
  onBack: () => void
  onConfirm: () => void
}

function StepReturnToggles({
  state,
  onSetReturnItemIds,
  onToggleReturnItem,
  onBack,
  onConfirm,
}: StepReturnTogglesProps) {
  const { data: allItems } = useQuery(getAllClothingItemsQuery())
  const { data: allTypes } = useQuery(getAllClothingTypesQuery())

  // Build resolved locker items (items at the selected PERSONAL location)
  const lockerItems: ResolvedClothingItem[] = (() => {
    if (!allItems || !allTypes || state.targetLocationId === null) return []
    const typeMap = new Map(allTypes.map((t) => [t.id, t]))
    return allItems
      .filter((i) => i.locationId === state.targetLocationId)
      .flatMap((i) => {
        const type = typeMap.get(i.typeId)
        if (!type) return []
        return [{ clothingItem: i, clothingType: type }]
      })
  })()

  // Auto-toggle on first render when locker items are available
  const didAutoToggle = useRef(false)
  useEffect(() => {
    if (didAutoToggle.current || lockerItems.length === 0) return
    didAutoToggle.current = true
    const autoToggled = autoToggleReturnsByType(state.takeItems, lockerItems)
    onSetReturnItemIds(autoToggled)
  }, [lockerItems.length])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Schritt 3: Rückgabe wählen</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground text-sm">
          Wähle die Kleidungsstücke aus dem Spind aus, die zurückgegeben werden
          sollen. Passende Typen wurden bereits vorausgewählt.
        </p>

        <RenderIf when={lockerItems.length === 0}>
          <p className="text-muted-foreground text-sm italic">
            Keine Kleidung im Spind gefunden.
          </p>
        </RenderIf>

        <RenderIf when={lockerItems.length > 0}>
          <div className="space-y-2">
            {lockerItems.map((item) => {
              const checked = state.returnItemIds.has(item.clothingItem.id)
              return (
                <label
                  key={item.clothingItem.id}
                  className="flex min-h-12 cursor-pointer items-center gap-3 rounded-lg border p-3 hover:bg-muted/50"
                >
                  <Checkbox
                    checked={checked}
                    onCheckedChange={() =>
                      onToggleReturnItem(item.clothingItem.id)
                    }
                    className="size-5"
                  />
                  <span className="text-base">
                    {item.clothingType.name} – {item.clothingItem.size}
                  </span>
                </label>
              )
            })}
          </div>
        </RenderIf>

        <div className="flex justify-end gap-3 pt-2">
          <TouchButton variant="outline" onClick={onBack}>
            ← Zurück
          </TouchButton>
          <TouchButton onClick={onConfirm}>Weiter →</TouchButton>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Step 4: Wash Location Picker ─────────────────────────────────────────────

interface StepWashLocationPickerProps {
  onSelect: (locationId: number) => void
}

function StepWashLocationPicker({ onSelect }: StepWashLocationPickerProps) {
  const { data: allLocations } = useQuery(getAllClothingLocationsQuery())

  const washLocations: ClothingLocation[] = (allLocations ?? []).filter(
    (l) => l.type === "WAESCHE",
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>Schritt 4: Wäsche-Ziel wählen</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground text-sm">
          Wähle den Wäschekorb aus, in den die zurückgegebene Kleidung soll.
        </p>

        <RenderIf when={washLocations.length === 0}>
          <p className="text-muted-foreground text-sm italic">
            Keine Wäsche-Standorte gefunden.
          </p>
        </RenderIf>

        <RenderIf when={washLocations.length > 0}>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {washLocations.map((loc) => (
              <TouchButton
                key={loc.id}
                variant="outline"
                className="h-auto min-h-16 flex-col gap-1 p-4 text-wrap"
                onClick={() => onSelect(loc.id)}
              >
                <span className="text-base font-medium">{loc.name}</span>
              </TouchButton>
            ))}
          </div>
        </RenderIf>
      </CardContent>
    </Card>
  )
}

// ─── Step 5: Review + Submit ──────────────────────────────────────────────────

interface StepReviewProps {
  state: ReturnType<typeof useCheckoutWizard>["state"]
  onSubmitOk: () => void
  onBack: () => void
  onReset: () => void
}

interface DiscrepancyPending {
  itemIds: number[]
}

function StepReview({ state, onSubmitOk, onBack }: StepReviewProps) {
  const { data: allItems } = useQuery(getAllClothingItemsQuery())
  const { data: allTypes } = useQuery(getAllClothingTypesQuery())
  const { data: allLocations } = useQuery(getAllClothingLocationsQuery())
  const [discrepancyPending, setDiscrepancyPending] =
    useState<DiscrepancyPending | null>(null)

  const checkout = useMutation(checkoutMutation())

  const typeMap = new Map((allTypes ?? []).map((t) => [t.id, t]))
  const locationMap = new Map((allLocations ?? []).map((l) => [l.id, l]))

  // Resolved return items
  const returnItems: ResolvedClothingItem[] = [...state.returnItemIds].flatMap(
    (id) => {
      const raw = (allItems ?? []).find((i) => i.id === id)
      if (!raw) return []
      const type = typeMap.get(raw.typeId)
      if (!type) return []
      return [{ clothingItem: raw, clothingType: type }]
    },
  )

  const washLocationName =
    state.returnLocationId !== null
      ? (locationMap.get(state.returnLocationId)?.name ?? "–")
      : "–"

  async function handleSubmit(acknowledgedItemIds: number[] = []) {
    const body = {
      targetLocationId: state.targetLocationId!,
      takeItemIds: state.takeItems.map((i) => i.clothingItem.id),
      returnItemIds: [...state.returnItemIds],
      returnLocationId: state.returnLocationId ?? undefined,
      acknowledgedItemIds,
    }
    try {
      const response = await checkout.mutateAsync(body)
      if (response.status === "ok") {
        onSubmitOk()
      } else {
        setDiscrepancyPending({
          itemIds: response.discrepancies.map((d) => d.itemId),
        })
      }
    } catch {
      toast.error(
        "Fehler beim Abschließen des Vorgangs. Bitte erneut versuchen.",
      )
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Schritt 5: Überprüfen</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Take items */}
          <div className="space-y-2">
            <p className="text-sm font-semibold">
              Ausgabe ({state.takeItems.length})
            </p>
            <RenderIf when={state.takeItems.length === 0}>
              <p className="text-muted-foreground text-sm italic">
                Keine Kleidung ausgewählt.
              </p>
            </RenderIf>
            <RenderIf when={state.takeItems.length > 0}>
              <div className="space-y-1">
                {state.takeItems.map((item) => (
                  <div
                    key={item.clothingItem.id}
                    className="flex items-center justify-between rounded border px-3 py-2"
                  >
                    <span>
                      {item.clothingType.name} – {item.clothingItem.size}
                    </span>
                    <RenderIf
                      when={state.discrepantItemIds.has(item.clothingItem.id)}
                    >
                      <Badge variant="outline" className="text-amber-600">
                        Nicht in Pool
                      </Badge>
                    </RenderIf>
                  </div>
                ))}
              </div>
            </RenderIf>
          </div>

          {/* Return items */}
          <div className="space-y-2">
            <p className="text-sm font-semibold">
              Rückgabe ({returnItems.length})
            </p>
            <RenderIf when={returnItems.length === 0}>
              <p className="text-muted-foreground text-sm italic">
                Keine Rückgabe.
              </p>
            </RenderIf>
            <RenderIf when={returnItems.length > 0}>
              <div className="space-y-1">
                {returnItems.map((item) => (
                  <div
                    key={item.clothingItem.id}
                    className="flex items-center justify-between rounded border px-3 py-2"
                  >
                    <span>
                      {item.clothingType.name} – {item.clothingItem.size}
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-muted-foreground text-sm">
                Wäsche-Ziel: <strong>{washLocationName}</strong>
              </p>
            </RenderIf>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <TouchButton
              variant="outline"
              onClick={onBack}
              disabled={checkout.isPending}
            >
              ← Zurück
            </TouchButton>
            <TouchButton
              disabled={checkout.isPending}
              onClick={() => void handleSubmit()}
            >
              {checkout.isPending ? "Wird gesendet…" : "Bestätigen"}
            </TouchButton>
          </div>
        </CardContent>
      </Card>

      {/* Phase-2 discrepancy dialog */}
      <AlertDialog
        open={discrepancyPending !== null}
        onOpenChange={(open) => {
          if (!open) setDiscrepancyPending(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Abweichungen bestätigen</AlertDialogTitle>
            <AlertDialogDescription>
              Das System hat Abweichungen festgestellt (
              {discrepancyPending?.itemIds.length ?? 0} Artikel). Soll der
              Vorgang trotzdem abgeschlossen werden?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => setDiscrepancyPending(null)}
              className="min-h-12"
            >
              Abbrechen
            </AlertDialogCancel>
            <AlertDialogAction
              className="min-h-12"
              onClick={() => {
                const ids = discrepancyPending?.itemIds ?? []
                setDiscrepancyPending(null)
                void handleSubmit(ids)
              }}
            >
              Trotzdem bestätigen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

// ─── Step 6: Success ──────────────────────────────────────────────────────────

const SUCCESS_REDIRECT_SECONDS = 15

interface StepSuccessProps {
  onReset: () => void
  onNavigateToOverview: () => void
}

function StepSuccess({ onReset, onNavigateToOverview }: StepSuccessProps) {
  const [secondsLeft, setSecondsLeft] = useState(SUCCESS_REDIRECT_SECONDS)

  useEffect(() => {
    if (secondsLeft <= 0) {
      onNavigateToOverview()
      return
    }
    const id = setTimeout(() => setSecondsLeft((s) => s - 1), 1000)
    return () => clearTimeout(id)
  }, [secondsLeft, onNavigateToOverview])

  return (
    <div className="space-y-4">
      <div>
        <p className="text-lg font-semibold">Vorgang abgeschlossen</p>
        <p className="text-muted-foreground text-sm">
          Die Ausgabe wurde erfolgreich abgeschlossen. Alle Kleidungsstücke
          wurden korrekt verbucht.
        </p>
      </div>
      <p className="text-muted-foreground text-sm">
        Weiterleitung zur Übersicht in {secondsLeft} Sekunde
        {secondsLeft !== 1 ? "n" : ""}…
      </p>
      <div className="flex gap-3">
        <TouchButton onClick={onReset}>Neuen Vorgang starten</TouchButton>
        <TouchButton variant="outline" onClick={onNavigateToOverview}>
          Zur Übersicht
        </TouchButton>
      </div>
    </div>
  )
}
