import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"
import { toast } from "sonner"
import { useEffect, useRef, useState } from "react"

import { getAllClothingLocationsQuery } from "#/clothing/service/clothingLocationsQueries"
import {
  formatClothingLocationLabel,
  formatClothingLocationLabelOrDefault,
} from "#/clothing/components/shared/clothingLocationLabel"
import { getAllClothingItemsQuery } from "#/clothing/service/clothingItemsQueries"
import { getAllClothingTypesQuery } from "#/clothing/service/clothingTypesQueries"
import { useCheckoutWizard } from "#/clothing/checkout/useCheckoutWizard"
import type { CheckoutStep } from "#/clothing/checkout/useCheckoutWizard"
import { checkoutMutation } from "#/clothing/checkout/service/checkoutQueries"
import type { ResolvedClothingItem } from "#/clothing/model/clothingItems"
import { autoToggleReturnsByType } from "#/clothing/checkout/autoToggleReturnsByType"
import {
  TouchButton,
  TouchCombobox,
} from "#/clothing/checkout/components/TouchComponents"
import type { ComboboxOption } from "#/clothing/checkout/components/TouchComponents"
import type { Step } from "#/components/base/VerticalStepper"
import StepperWizard from "#/components/base/StepperWizard"
import RenderIf from "#/components/base/RenderIf"
import ClothingItemScanner from "#/clothing/components/shared/ClothingItemScanner"
import ClothingItemRow from "#/clothing/components/shared/ClothingItemRow"
import PageSection from "#/components/base/PageSection"
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
import { Badge } from "#/components/ui/badge"
import type { ClothingLocation } from "#/clothing/model/clothingLocations"

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
    <PageSection
      title="Klamotten tauschen"
      buttons={
        <TouchButton
          variant="outline"
          onClick={async () => {
            await navigate({ to: "/pool-clothing" })
          }}
        >
          Abbrechen
        </TouchButton>
      }
    >
      <StepperWizard
        steps={CHECKOUT_STEPS}
        currentStep={state.step}
        onStepClick={(n) => goToStep(n as CheckoutStep)}
        stepContents={{
          1: <StepTargetPickerContent onSelect={selectTarget} />,
          2: (
            <StepItemScannerContent
              state={state}
              onAddItem={addItem}
              onRemoveItem={removeItem}
              onBack={goBack}
              onNext={advanceToReturns}
            />
          ),
          3: (
            <StepReturnTogglesContent
              state={state}
              onSetReturnItemIds={setReturnItemIds}
              onToggleReturnItem={toggleReturnItem}
              onBack={goBack}
              onConfirm={confirmReturns}
            />
          ),
          4: <StepWashLocationPickerContent onSelect={selectWashLocation} />,
          5: (
            <StepReviewContent
              state={state}
              onSubmitOk={submitOk}
              onBack={goBack}
              onReset={reset}
            />
          ),
          6: (
            <StepSuccessContent
              onReset={reset}
              onNavigateToOverview={() =>
                void navigate({ to: "/pool-clothing" })
              }
            />
          ),
        }}
      />
    </PageSection>
  )
}

// ─── Step 1: Target Picker ────────────────────────────────────────────────────

interface StepTargetPickerContentProps {
  onSelect: (locationId: number) => void
}

function StepTargetPickerContent({ onSelect }: StepTargetPickerContentProps) {
  const { data: allLocations } = useQuery(getAllClothingLocationsQuery())
  const [search] = useState("")

  const personalLocations = (allLocations ?? []).filter(
    (l) => l.type === "PERSONAL",
  )

  const options: ComboboxOption[] = personalLocations.map((l) => ({
    value: String(l.id),
    label: formatClothingLocationLabel(l),
  }))

  const filteredOptions = options.filter((o) =>
    o.label.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div className="space-y-4">
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
    </div>
  )
}

// ─── Step 2: Item Scanner ─────────────────────────────────────────────────────

interface StepItemScannerContentProps {
  state: ReturnType<typeof useCheckoutWizard>["state"]
  onAddItem: (item: ResolvedClothingItem) => void
  onRemoveItem: (itemId: number) => void
  onBack: () => void
  onNext: () => void
}

interface PendingConfirmation {
  item: ResolvedClothingItem
  actualLocationName: string
}

function StepItemScannerContent({
  state,
  onAddItem,
  onRemoveItem,
  onBack,
  onNext,
}: StepItemScannerContentProps) {
  const [pendingConfirmation, setPendingConfirmation] =
    useState<PendingConfirmation | null>(null)

  function handleItemResolved(item: ResolvedClothingItem) {
    const location = item.location

    if (!location) {
      onAddItem(item)
      return
    }

    const isAtPool = location.type === "POOL"

    if (!isAtPool) {
      setPendingConfirmation({
        item,
        actualLocationName: formatClothingLocationLabel(location),
      })
      return
    }

    onAddItem(item)
  }

  return (
    <>
      <div className="space-y-4">
        <p className="text-muted-foreground text-sm">
          Scanne einen Barcode oder suche manuell nach einem Kleidungsstück.
        </p>

        <ClothingItemScanner
          items={state.takeItems}
          onItemResolved={handleItemResolved}
          onRemoveItem={onRemoveItem}
          renderItemBadge={(item) => {
            const loc = item.location
            if (!loc || loc.type === "POOL") return null
            return (
              <Badge variant="outline">
                {formatClothingLocationLabel(loc)}
              </Badge>
            )
          }}
        />

        <div className="flex justify-end gap-3 pt-2">
          <TouchButton variant="outline" onClick={onBack}>
            ← Zurück
          </TouchButton>
          <TouchButton disabled={state.takeItems.length === 0} onClick={onNext}>
            Weiter →
          </TouchButton>
        </div>
      </div>

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
                  onAddItem(pendingConfirmation.item)
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

interface StepReturnTogglesContentProps {
  state: ReturnType<typeof useCheckoutWizard>["state"]
  onSetReturnItemIds: (ids: Set<number>) => void
  onToggleReturnItem: (itemId: number) => void
  onBack: () => void
  onConfirm: () => void
}

function StepReturnTogglesContent({
  state,
  onSetReturnItemIds,
  onToggleReturnItem,
  onBack,
  onConfirm,
}: StepReturnTogglesContentProps) {
  const { data: allItems } = useQuery(getAllClothingItemsQuery())
  const { data: allTypes } = useQuery(getAllClothingTypesQuery())

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

  const didAutoToggle = useRef(false)
  useEffect(() => {
    if (didAutoToggle.current || lockerItems.length === 0) return
    didAutoToggle.current = true
    const autoToggled = autoToggleReturnsByType(state.takeItems, lockerItems)
    onSetReturnItemIds(autoToggled)
  }, [lockerItems.length])

  return (
    <div className="space-y-4">
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
              <ClothingItemRow
                key={item.clothingItem.id}
                item={item}
                asLabel
                leading={
                  <Checkbox
                    checked={checked}
                    onCheckedChange={() =>
                      onToggleReturnItem(item.clothingItem.id)
                    }
                    className="size-5"
                  />
                }
              />
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
    </div>
  )
}

// ─── Step 4: Wash Location Picker ─────────────────────────────────────────────

interface StepWashLocationPickerContentProps {
  onSelect: (locationId: number) => void
}

function StepWashLocationPickerContent({
  onSelect,
}: StepWashLocationPickerContentProps) {
  const { data: allLocations } = useQuery(getAllClothingLocationsQuery())

  const washLocations: ClothingLocation[] = (allLocations ?? []).filter(
    (l) => l.type === "WAESCHE",
  )

  return (
    <div className="space-y-4">
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
              <span className="text-base font-medium">
                {formatClothingLocationLabel(loc)}
              </span>
            </TouchButton>
          ))}
        </div>
      </RenderIf>
    </div>
  )
}

// ─── Step 5: Review + Submit ──────────────────────────────────────────────────

interface StepReviewContentProps {
  state: ReturnType<typeof useCheckoutWizard>["state"]
  onSubmitOk: () => void
  onBack: () => void
  onReset: () => void
}

function StepReviewContent({
  state,
  onSubmitOk,
  onBack,
}: StepReviewContentProps) {
  const { data: allItems } = useQuery(getAllClothingItemsQuery())
  const { data: allTypes } = useQuery(getAllClothingTypesQuery())
  const { data: allLocations } = useQuery(getAllClothingLocationsQuery())

  const queryClient = useQueryClient()
  const checkout = useMutation(checkoutMutation(queryClient))

  const typeMap = new Map((allTypes ?? []).map((t) => [t.id, t]))
  const locationMap = new Map((allLocations ?? []).map((l) => [l.id, l]))
  const targetLocationName = formatClothingLocationLabelOrDefault(
    locationMap.get(state.targetLocationId!),
  )

  const returnItems: ResolvedClothingItem[] = [...state.returnItemIds].flatMap(
    (id) => {
      const raw = (allItems ?? []).find((i) => i.id === id)
      if (!raw) return []
      const type = typeMap.get(raw.typeId)
      if (!type) return []
      return [{ clothingItem: raw, clothingType: type }]
    },
  )

  const location =
    state.returnLocationId !== null
      ? locationMap.get(state.returnLocationId)
      : undefined
  const washLocationName = formatClothingLocationLabelOrDefault(location)

  async function handleSubmit() {
    const body = {
      targetLocationId: state.targetLocationId!,
      takeItemIds: state.takeItems.map((i) => i.clothingItem.id),
      returnItemIds: [...state.returnItemIds],
      returnLocationId: state.returnLocationId ?? undefined,
    }
    try {
      await checkout.mutateAsync(body)
      onSubmitOk()
    } catch {
      toast.error(
        "Fehler beim Abschließen des Vorgangs. Bitte erneut versuchen.",
      )
    }
  }

  return (
    <div className="space-y-6">
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
              <ClothingItemRow key={item.clothingItem.id} item={item} />
            ))}
          </div>
          <p className="text-muted-foreground text-sm">
            Ziel: <strong>{targetLocationName}</strong>
          </p>
        </RenderIf>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-semibold">Rückgabe ({returnItems.length})</p>
        <RenderIf when={returnItems.length === 0}>
          <p className="text-muted-foreground text-sm italic">
            Keine Rückgabe.
          </p>
        </RenderIf>
        <RenderIf when={returnItems.length > 0}>
          <div className="space-y-1">
            {returnItems.map((item) => (
              <ClothingItemRow key={item.clothingItem.id} item={item} />
            ))}
          </div>
          <p className="text-muted-foreground text-sm">
            Ziel: <strong>{washLocationName}</strong>
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
    </div>
  )
}

// ─── Step 6: Success ──────────────────────────────────────────────────────────

const SUCCESS_REDIRECT_SECONDS = 15

interface StepSuccessContentProps {
  onReset: () => void
  onNavigateToOverview: () => void
}

function StepSuccessContent({
  onReset,
  onNavigateToOverview,
}: StepSuccessContentProps) {
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
