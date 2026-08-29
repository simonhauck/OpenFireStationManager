import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import type { ComboboxOption } from "#/clothing/checkout/components/TouchComponents"
import {
  TouchButton,
  TouchCombobox,
} from "#/clothing/checkout/components/TouchComponents"
import ClothingItemScanner from "#/clothing/components/shared/ClothingItemScanner"
import {
  formatClothingLocationLabel,
  formatClothingLocationLabelOrDefault,
} from "#/clothing/components/shared/clothingLocationLabel"
import type { ResolvedClothingItem } from "#/clothing/model/clothingItems"
import { relocationMutation } from "#/clothing/relocation/service/relocationQueries"
import { useRelocationWizard } from "#/clothing/relocation/useRelocationWizard"
import { getAllClothingLocationsQuery } from "#/clothing/service/clothingLocationsQueries"
import PageSection from "#/components/base/PageSection"
import RenderIf from "#/components/base/RenderIf"
import type { StepperWizardStep } from "#/components/base/StepperWizard"
import StepperWizard from "#/components/base/StepperWizard"

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

  const steps: StepperWizardStep[] = [
    {
      label: "Ziel wählen",
      description: "Ziel-Standort auswählen",
      content: <StepTargetPickerContent onSelect={selectTarget} />,
    },
    {
      label: "Kleidung scannen",
      description: "Barcode scannen oder manuell suchen",
      content: (
        <StepItemScannerContent
          state={state}
          onAddItem={addItem}
          onRemoveItem={removeItem}
          onBack={goBack}
          onNext={advanceToReview}
        />
      ),
    },
    {
      label: "Überprüfen",
      description: "Batch vor Bestätigung prüfen",
      content: (
        <StepReviewContent
          state={state}
          onSubmitOk={submitOk}
          onBack={goBack}
        />
      ),
    },
    {
      label: "Fertig",
      description: "Umlagerung abgeschlossen",
      content: (
        <StepSuccessContent
          state={state}
          onReset={reset}
          onNavigateToOverview={() => void navigate({ to: "/pool-clothing" })}
        />
      ),
    },
  ]

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
      <StepperWizard
        steps={steps}
        currentStep={state.step}
        onStepClick={() => {
          /* wizard is linear */
        }}
        disableStepClickOnLastStep={false}
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

  const options: ComboboxOption[] = (allLocations ?? []).map((l) => ({
    value: String(l.id),
    label: formatClothingLocationLabel(l, { showType: true }),
  }))

  return (
    <div className="space-y-4">
      <p className="text-muted-foreground text-sm">
        Wähle den Ziel-Standort aus, an den die Kleidung umgelagert werden soll.
      </p>
      <TouchCombobox
        options={options}
        value={null}
        onSelect={(value) => onSelect(Number(value))}
        placeholder="Standort auswählen..."
        searchPlaceholder="Standort suchen..."
        emptyMessage="Kein Standort gefunden."
      />
    </div>
  )
}

// ─── Step 2: Item Scanner ─────────────────────────────────────────────────────

interface StepItemScannerContentProps {
  state: ReturnType<typeof useRelocationWizard>["state"]
  onAddItem: (item: ResolvedClothingItem) => void
  onRemoveItem: (itemId: number) => void
  onBack: () => void
  onNext: () => void
}

function StepItemScannerContent({
  state,
  onAddItem,
  onRemoveItem,
  onBack,
  onNext,
}: StepItemScannerContentProps) {
  return (
    <div className="space-y-4">
      <p className="text-muted-foreground text-sm">
        Scanne einen Barcode oder suche manuell nach einem Kleidungsstück.
      </p>

      <ClothingItemScanner
        items={state.items}
        onItemResolved={onAddItem}
        onRemoveItem={onRemoveItem}
      />

      <div className="flex justify-end gap-3 pt-2">
        <TouchButton variant="outline" onClick={onBack}>
          ← Zurück
        </TouchButton>
        <TouchButton disabled={state.items.length === 0} onClick={onNext}>
          Weiter →
        </TouchButton>
      </div>
    </div>
  )
}

// ─── Step 3: Review + Submit ──────────────────────────────────────────────────

interface StepReviewContentProps {
  state: ReturnType<typeof useRelocationWizard>["state"]
  onSubmitOk: () => void
  onBack: () => void
}

function StepReviewContent({
  state,
  onSubmitOk,
  onBack,
}: StepReviewContentProps) {
  const { data: allLocations } = useQuery(getAllClothingLocationsQuery())
  const queryClient = useQueryClient()
  const relocate = useMutation(relocationMutation(queryClient))

  const locationMap = new Map((allLocations ?? []).map((l) => [l.id, l]))
  const location =
    state.targetLocationId !== null
      ? locationMap.get(state.targetLocationId)
      : undefined
  const targetLocationName = formatClothingLocationLabelOrDefault(location, {
    showType: true,
  })

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
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-sm font-semibold">
          Ziel-Standort:{" "}
          <span className="font-normal">{targetLocationName}</span>
        </p>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-semibold">Kleidung ({state.items.length})</p>
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
    </div>
  )
}

// ─── Step 4: Success ──────────────────────────────────────────────────────────

interface StepSuccessContentProps {
  state: ReturnType<typeof useRelocationWizard>["state"]
  onReset: () => void
  onNavigateToOverview: () => void
}

function StepSuccessContent({
  state,
  onReset,
  onNavigateToOverview,
}: StepSuccessContentProps) {
  const { data: allLocations } = useQuery(getAllClothingLocationsQuery())
  const [secondsLeft, setSecondsLeft] = useState(SUCCESS_REDIRECT_SECONDS)

  const locationMap = new Map((allLocations ?? []).map((l) => [l.id, l]))
  const targetLocationName = formatClothingLocationLabelOrDefault(
    state.targetLocationId !== null
      ? locationMap.get(state.targetLocationId)
      : undefined,
    { showType: true },
  )

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
