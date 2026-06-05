import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"
import { toast } from "sonner"
import { useEffect, useState } from "react"

import { getAllClothingLocationsQuery } from "#/clothing/service/clothingLocationsQueries"
import {
  formatClothingLocationLabel,
  formatClothingLocationLabelOrDefault,
} from "#/clothing/components/shared/clothingLocationLabel"
import { useReturnWizard } from "#/clothing/return/useReturnWizard"
import type { ReturnStep } from "#/clothing/return/useReturnWizard"
import { returnMutation } from "#/clothing/return/service/returnQueries"
import type { ResolvedClothingItem } from "#/clothing/model/clothingItems"
import { TouchButton } from "#/clothing/checkout/components/TouchComponents"
import type { StepperWizardStep } from "#/components/base/StepperWizard"
import StepperWizard from "#/components/base/StepperWizard"
import RenderIf from "#/components/base/RenderIf"
import ClothingItemScanner from "#/clothing/components/shared/ClothingItemScanner"
import ClothingItemRow from "#/clothing/components/shared/ClothingItemRow"
import { LockerItemDialog } from "#/clothing/return/components/LockerItemDialog"
import PageSection from "#/components/base/PageSection"
import type { CheckoutRequest } from "#/clothing/model/checkout"
import type { ClothingLocation } from "#/clothing/model/clothingLocations"

export default function ReturnPage({
  returnTarget,
}: {
  returnTarget: "WAESCHE" | "POOL"
}) {
  const navigate = useNavigate()
  const locationType = returnTarget

  const {
    state,
    addItem,
    removeItem,
    advanceToTarget,
    selectTarget,
    submitOk,
    goBack,
    goToStep,
    reset,
  } = useReturnWizard()

  const title =
    locationType == "POOL"
      ? "Klamotten in den Pool geben"
      : "Klamotten in die Wäsche geben"

  const { data: allLocations } = useQuery(getAllClothingLocationsQuery())
  const targets = (allLocations ?? []).filter((l) => l.type === locationType)

  const steps: StepperWizardStep[] = [
    {
      label: "Kleidung auswählen",
      description: "Scannen oder aus Standort wählen",
      content: (
        <StepItemPickerContent
          state={state}
          onAddItem={addItem}
          onRemoveItem={removeItem}
          onNext={advanceToTarget}
        />
      ),
    },
    {
      label: "Ziel wählen",
      description: "Ziel Standort auswählen",
      content: (
        <StepReturnTargetPickerContent
          locationType={locationType}
          targets={targets}
          onSelect={selectTarget}
        />
      ),
    },
    {
      label: "Überprüfen",
      description: "Rückgabe prüfen",
      content: (
        <StepReviewContent
          state={state}
          allLocations={allLocations ?? []}
          onSubmitOk={submitOk}
          onBack={goBack}
        />
      ),
    },
    {
      label: "Bestätigen",
      description: "Vorgang abschließen",
      content: (
        <StepSuccessContent
          onReset={reset}
          onNavigateToOverview={() => void navigate({ to: "/pool-clothing" })}
        />
      ),
    },
  ]

  if (targets.length === 0) {
    return (
      <PageSection title={title}>
        <p className="text-muted-foreground text-sm">
          {locationType === "WAESCHE"
            ? "Keine Wäsche-Standorte eingerichtet."
            : "Keine Pool-Standorte eingerichtet."}
        </p>
      </PageSection>
    )
  }

  return (
    <PageSection
      title={title}
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
        onStepClick={(n) => goToStep(n as ReturnStep)}
      />
    </PageSection>
  )
}

// ─── Step 1: Item Picker ──────────────────────────────────────────────────────

interface StepItemPickerContentProps {
  state: ReturnType<typeof useReturnWizard>["state"]
  onAddItem: (item: ResolvedClothingItem) => void
  onRemoveItem: (itemId: number) => void
  onNext: () => void
}

type PickerTab = "scanner" | "locker"

function StepItemPickerContent({
  state,
  onAddItem,
  onRemoveItem,
  onNext,
}: StepItemPickerContentProps) {
  const [activeTab, setActiveTab] = useState<PickerTab>("scanner")
  const [dialogOpen, setDialogOpen] = useState(false)

  const existingItemIds = new Set(
    state.returnItems.map((i) => i.clothingItem.id),
  )

  return (
    <div className="space-y-4">
      <div className="flex rounded-lg border p-1">
        <TouchButton
          variant={activeTab === "scanner" ? "default" : "ghost"}
          className="flex-1"
          onClick={() => setActiveTab("scanner")}
        >
          Scannen
        </TouchButton>
        <TouchButton
          variant={activeTab === "locker" ? "default" : "ghost"}
          className="flex-1"
          onClick={() => setDialogOpen(true)}
        >
          Aus Spind auswählen
        </TouchButton>
      </div>

      <RenderIf when={activeTab === "scanner"}>
        <ClothingItemScanner
          items={state.returnItems}
          onItemResolved={onAddItem}
          onRemoveItem={onRemoveItem}
          renderItemBadge={() => null}
        />
      </RenderIf>

      <LockerItemDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        existingItemIds={existingItemIds}
        onAddItems={(items) => {
          for (const item of items) {
            onAddItem(item)
          }
        }}
      />

      <div className="flex justify-end gap-3 pt-2">
        <TouchButton disabled={state.returnItems.length === 0} onClick={onNext}>
          Weiter →
        </TouchButton>
      </div>
    </div>
  )
}

// ─── Step 2: Return Target Picker ─────────────────────────────────────────────

interface StepReturnTargetPickerContentProps {
  locationType: "WAESCHE" | "POOL"
  targets: ClothingLocation[]
  onSelect: (locationId: number) => void
}

function StepReturnTargetPickerContent({
  locationType,
  targets,
  onSelect,
}: StepReturnTargetPickerContentProps) {
  const description =
    locationType === "POOL"
      ? "Wähle den Pool-Standort aus, in den die Kleidung zurückgegeben wird."
      : "Wähle den Wäschekorb aus, in den die Kleidung soll."

  return (
    <div className="space-y-4">
      <p className="text-muted-foreground text-sm">{description}</p>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {targets.map((loc) => (
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
    </div>
  )
}

// ─── Step 3: Review ───────────────────────────────────────────────────────────

interface StepReviewContentProps {
  state: ReturnType<typeof useReturnWizard>["state"]
  allLocations: ClothingLocation[]
  onSubmitOk: () => void
  onBack: () => void
}

function StepReviewContent({
  state,
  allLocations,
  onSubmitOk,
  onBack,
}: StepReviewContentProps) {
  const queryClient = useQueryClient()
  const mutation = useMutation(returnMutation(queryClient))

  const locationMap = new Map(allLocations.map((l) => [l.id, l]))
  const targetName = formatClothingLocationLabelOrDefault(
    locationMap.get(state.returnLocationId!),
  )

  async function handleSubmit() {
    const body: CheckoutRequest = {
      targetLocationId: undefined,
      takeItemIds: [],
      returnItemIds: state.returnItems.map((i) => i.clothingItem.id),
      returnLocationId: state.returnLocationId,
    }
    try {
      await mutation.mutateAsync(body)
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
          Rückgabe ({state.returnItems.length})
        </p>
        <RenderIf when={state.returnItems.length === 0}>
          <p className="text-muted-foreground text-sm italic">
            Keine Kleidung ausgewählt.
          </p>
        </RenderIf>
        <RenderIf when={state.returnItems.length > 0}>
          <div className="space-y-1">
            {state.returnItems.map((item) => (
              <ClothingItemRow key={item.clothingItem.id} item={item} />
            ))}
          </div>
          <p className="text-muted-foreground text-sm">
            Ziel: <strong>{targetName}</strong>
          </p>
        </RenderIf>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <TouchButton
          variant="outline"
          onClick={onBack}
          disabled={mutation.isPending}
        >
          ← Zurück
        </TouchButton>
        <TouchButton
          disabled={mutation.isPending}
          onClick={() => void handleSubmit()}
        >
          {mutation.isPending ? "Wird gesendet…" : "Bestätigen"}
        </TouchButton>
      </div>
    </div>
  )
}

// ─── Step 4: Success ──────────────────────────────────────────────────────────

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
          Die Rückgabe wurde erfolgreich abgeschlossen.
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
