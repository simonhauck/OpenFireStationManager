import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"
import { toast } from "sonner"
import { useEffect, useState } from "react"

import { getAllClothingLocationsQuery } from "#/clothing/service/clothingLocationsQueries"
import { useRelocationWizard } from "#/clothing/relocation/useRelocationWizard"
import { relocationMutation } from "#/clothing/relocation/service/relocationQueries"
import type { ResolvedClothingItem } from "#/clothing/checkout/service/checkoutQueries"
import {
  TouchButton,
  TouchCombobox,
} from "#/clothing/checkout/components/TouchComponents"
import type { ComboboxOption } from "#/clothing/checkout/components/TouchComponents"
import { VerticalStepper } from "#/components/base/VerticalStepper"
import type { Step } from "#/components/base/VerticalStepper"
import PageSection from "#/components/base/PageSection"
import RenderIf from "#/components/base/RenderIf"
import ClothingItemScanner from "#/clothing/components/shared/ClothingItemScanner"
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card"

const RELOCATION_STEPS: Step[] = [
  { label: "Ziel wählen", description: "Ziel-Standort auswählen" },
  {
    label: "Kleidung scannen",
    description: "Barcode scannen oder manuell suchen",
  },
  { label: "Überprüfen", description: "Batch vor Bestätigung prüfen" },
  { label: "Fertig", description: "Umlagerung abgeschlossen" },
]

const SUCCESS_REDIRECT_SECONDS = 15

export default function RelocationPage() {
  const navigate = useNavigate()
  const {
    state,
    selectTarget,
    addItem,
    removeItem,
    advanceToReview,
    submitOk,
    goBack,
    reset,
  } = useRelocationWizard()

  return (
    <PageSection
      title="Umlagerung"
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
      <div className="flex items-stretch">
        {/* Stepper sidebar — hidden on mobile */}
        <aside className="hidden shrink-0 sm:block">
          <div className="pr-6 pb-2">
            <VerticalStepper
              steps={RELOCATION_STEPS}
              currentStep={state.step}
              onStepClick={() => {
                /* wizard is linear — no jump navigation */
              }}
            />
          </div>
        </aside>

        {/* Step content */}
        <div className="min-w-0 flex-1 space-y-4">
          <RenderIf when={state.step === 1}>
            <StepTargetPicker onSelect={selectTarget} />
          </RenderIf>

          <RenderIf when={state.step === 2}>
            <StepItemScanner
              state={state}
              onAddItem={addItem}
              onRemoveItem={removeItem}
              onBack={goBack}
              onNext={advanceToReview}
            />
          </RenderIf>

          <RenderIf when={state.step === 3}>
            <StepReview state={state} onSubmitOk={submitOk} onBack={goBack} />
          </RenderIf>

          <RenderIf when={state.step === 4}>
            <StepSuccess
              state={state}
              onReset={reset}
              onNavigateToOverview={() =>
                void navigate({ to: "/pool-clothing" })
              }
            />
          </RenderIf>
        </div>
      </div>
    </PageSection>
  )
}

// ─── Step 1: Target Picker ────────────────────────────────────────────────────

interface StepTargetPickerProps {
  onSelect: (locationId: number) => void
}

function StepTargetPicker({ onSelect }: StepTargetPickerProps) {
  const { data: allLocations } = useQuery(getAllClothingLocationsQuery())

  const options: ComboboxOption[] = (allLocations ?? []).map((l) => ({
    value: String(l.id),
    label: `${l.name} (${l.type})`,
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Schritt 1: Ziel wählen</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground text-sm">
          Wähle den Ziel-Standort aus, an den die Kleidung umgelagert werden
          soll.
        </p>
        <TouchCombobox
          options={options}
          value={null}
          onSelect={(value) => onSelect(Number(value))}
          placeholder="Standort auswählen..."
          searchPlaceholder="Standort suchen..."
          emptyMessage="Kein Standort gefunden."
        />
      </CardContent>
    </Card>
  )
}

// ─── Step 2: Item Scanner ─────────────────────────────────────────────────────

interface StepItemScannerProps {
  state: ReturnType<typeof useRelocationWizard>["state"]
  onAddItem: (item: ResolvedClothingItem) => void
  onRemoveItem: (itemId: number) => void
  onBack: () => void
  onNext: () => void
}

function StepItemScanner({
  state,
  onAddItem,
  onRemoveItem,
  onBack,
  onNext,
}: StepItemScannerProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Schritt 2: Kleidung scannen</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground text-sm">
          Scanne einen Barcode oder suche manuell nach einem Kleidungsstück.
        </p>

        <ClothingItemScanner
          items={state.items}
          onItemResolved={onAddItem}
          onRemoveItem={onRemoveItem}
        />

        {/* Weiter button */}
        <div className="flex justify-end gap-3 pt-2">
          <TouchButton variant="outline" onClick={onBack}>
            ← Zurück
          </TouchButton>
          <TouchButton disabled={state.items.length === 0} onClick={onNext}>
            Weiter →
          </TouchButton>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Step 3: Review + Submit ──────────────────────────────────────────────────

interface StepReviewProps {
  state: ReturnType<typeof useRelocationWizard>["state"]
  onSubmitOk: () => void
  onBack: () => void
}

function StepReview({ state, onSubmitOk, onBack }: StepReviewProps) {
  const { data: allLocations } = useQuery(getAllClothingLocationsQuery())
  const queryClient = useQueryClient()
  const relocate = useMutation(relocationMutation(queryClient))

  const locationMap = new Map((allLocations ?? []).map((l) => [l.id, l]))
  const targetLocationName =
    state.targetLocationId !== null
      ? (locationMap.get(state.targetLocationId)?.name ?? "–")
      : "–"

  async function handleSubmit() {
    try {
      await relocate.mutateAsync({
        targetLocationId: state.targetLocationId!,
        itemIds: state.items.map((i) => i.clothingItem.id),
      })
      onSubmitOk()
    } catch {
      toast.error(
        "Fehler beim Abschließen der Umlagerung. Bitte erneut versuchen.",
      )
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Schritt 3: Überprüfen</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <p className="text-sm font-semibold">
            Ziel-Standort:{" "}
            <span className="font-normal">{targetLocationName}</span>
          </p>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-semibold">
            Kleidung ({state.items.length})
          </p>
          <RenderIf when={state.items.length === 0}>
            <p className="text-muted-foreground text-sm italic">
              Keine Kleidung ausgewählt.
            </p>
          </RenderIf>
          <RenderIf when={state.items.length > 0}>
            <div className="space-y-1">
              {state.items.map((item) => (
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
          </RenderIf>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <TouchButton
            variant="outline"
            onClick={onBack}
            disabled={relocate.isPending}
          >
            ← Zurück
          </TouchButton>
          <TouchButton
            disabled={relocate.isPending || state.items.length === 0}
            onClick={() => void handleSubmit()}
          >
            {relocate.isPending ? "Wird gesendet…" : "Bestätigen"}
          </TouchButton>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Step 4: Success ──────────────────────────────────────────────────────────

interface StepSuccessProps {
  state: ReturnType<typeof useRelocationWizard>["state"]
  onReset: () => void
  onNavigateToOverview: () => void
}

function StepSuccess({
  state,
  onReset,
  onNavigateToOverview,
}: StepSuccessProps) {
  const { data: allLocations } = useQuery(getAllClothingLocationsQuery())
  const [secondsLeft, setSecondsLeft] = useState(SUCCESS_REDIRECT_SECONDS)

  const locationMap = new Map((allLocations ?? []).map((l) => [l.id, l]))
  const targetLocationName =
    state.targetLocationId !== null
      ? (locationMap.get(state.targetLocationId)?.name ?? "–")
      : "–"

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
        <p className="text-lg font-semibold">Umlagerung abgeschlossen</p>
        <p className="text-muted-foreground text-sm">
          {state.items.length} Kleidungsstück
          {state.items.length !== 1 ? "e" : ""} wurde
          {state.items.length !== 1 ? "n" : ""} erfolgreich nach{" "}
          <strong>{targetLocationName}</strong> umgelagert.
        </p>
      </div>
      <p className="text-muted-foreground text-sm">
        Weiterleitung zur Übersicht in {secondsLeft} Sekunde
        {secondsLeft !== 1 ? "n" : ""}…
      </p>
      <div className="flex gap-3">
        <TouchButton onClick={onReset}>Neue Umlagerung starten</TouchButton>
        <TouchButton variant="outline" onClick={onNavigateToOverview}>
          Zur Übersicht
        </TouchButton>
      </div>
    </div>
  )
}
