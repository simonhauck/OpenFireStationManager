import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"
import { toast } from "sonner"
import { useEffect, useState } from "react"

import { getAllClothingLocationsQuery } from "#/clothing/service/clothingLocationsQueries"
import { formatClothingLocationLabel } from "#/clothing/components/shared/clothingLocationLabel"
import { useInventoryReconciliationWizard } from "#/clothing/inventory-reconciliation/useInventoryReconciliationWizard"
import type { InventoryReconciliationStep } from "#/clothing/inventory-reconciliation/useInventoryReconciliationWizard"
import {
  inventoryReconciliationExecuteMutation,
  inventoryReconciliationPreviewQuery,
} from "#/clothing/inventory-reconciliation/service/inventoryReconciliationQueries"
import type { ResolvedClothingItem } from "#/clothing/model/clothingItems"
import {
  TouchButton,
  TouchCombobox,
} from "#/clothing/checkout/components/TouchComponents"
import type { ComboboxOption } from "#/clothing/checkout/components/TouchComponents"
import type { StepperWizardStep } from "#/components/base/StepperWizard"
import StepperWizard from "#/components/base/StepperWizard"
import PageSection from "#/components/base/PageSection"
import RenderIf from "#/components/base/RenderIf"
import { Badge } from "#/components/ui/badge"
import ClothingItemRow from "#/clothing/components/shared/ClothingItemRow"
import ClothingItemScanner from "#/clothing/components/shared/ClothingItemScanner"

const SUCCESS_REDIRECT_SECONDS = 15

export default function InventoryReconciliationPage() {
  const navigate = useNavigate()
  const {
    state,
    selectLocation,
    addItem,
    removeItem,
    advanceToDiff,
    submitOk,
    goBack,
    goToStep,
    reset,
  } = useInventoryReconciliationWizard()

  const steps: StepperWizardStep[] = [
    {
      label: "Standort wählen",
      description: "Standort für die Inventarisierung auswählen",
      content: <StepLocationPickerContent onSelect={selectLocation} />,
    },
    {
      label: "Kleidung scannen",
      description: "Barcode scannen oder manuell suchen",
      content: (
        <StepScannerContent
          state={state}
          onAddItem={addItem}
          onRemoveItem={removeItem}
          onBack={goBack}
          onNext={advanceToDiff}
        />
      ),
    },
    {
      label: "Differenzen & Bestätigen",
      description: "Änderungen prüfen und bestätigen",
      content: (
        <StepDiffContent state={state} onSubmitOk={submitOk} onBack={goBack} />
      ),
    },
    {
      label: "Fertig",
      description: "Inventarisierung abgeschlossen",
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
      title="Inventarisierung"
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
        onStepClick={(step) => goToStep(step as InventoryReconciliationStep)}
      />
    </PageSection>
  )
}

// ─── Step 1: Location Picker ─────────────────────────────────────────────────

interface StepLocationPickerContentProps {
  onSelect: (locationId: number) => void
}

function StepLocationPickerContent({
  onSelect,
}: StepLocationPickerContentProps) {
  const { data: allLocations } = useQuery(getAllClothingLocationsQuery())

  const options: ComboboxOption[] = (allLocations ?? []).map((l) => ({
    value: String(l.id),
    label: formatClothingLocationLabel(l, { showType: true }),
  }))

  return (
    <div className="space-y-4">
      <p className="text-muted-foreground text-sm">
        Wähle den Standort aus, dessen Bestand überprüft werden soll.
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

// ─── Step 2: Scanner ─────────────────────────────────────────────────────────

interface StepScannerContentProps {
  state: ReturnType<typeof useInventoryReconciliationWizard>["state"]
  onAddItem: (item: ResolvedClothingItem) => void
  onRemoveItem: (itemId: number) => void
  onBack: () => void
  onNext: () => void
}

function StepScannerContent({
  state,
  onAddItem,
  onRemoveItem,
  onBack,
  onNext,
}: StepScannerContentProps) {
  return (
    <div className="space-y-4">
      <p className="text-muted-foreground text-sm">
        Scanne alle Kleidungsstücke, die sich physisch an diesem Standort
        befinden.
      </p>

      <ClothingItemScanner
        items={state.scannedItems}
        onItemResolved={onAddItem}
        onRemoveItem={onRemoveItem}
        renderItemBadge={(item) =>
          item.location ? (
            <Badge variant="outline">
              {formatClothingLocationLabel(item.location)}
            </Badge>
          ) : null
        }
      />

      <div className="flex justify-end gap-3 pt-2">
        <TouchButton variant="outline" onClick={onBack}>
          ← Zurück
        </TouchButton>
        <TouchButton onClick={onNext}>Weiter →</TouchButton>
      </div>
    </div>
  )
}

// ─── Step 3: Diff & Confirm ─────────────────────────────────────────────────

interface StepDiffContentProps {
  state: ReturnType<typeof useInventoryReconciliationWizard>["state"]
  onSubmitOk: () => void
  onBack: () => void
}

function StepDiffContent({ state, onSubmitOk, onBack }: StepDiffContentProps) {
  const queryClient = useQueryClient()
  const executeMutation = useMutation(
    inventoryReconciliationExecuteMutation(queryClient),
  )

  const previewQuery = inventoryReconciliationPreviewQuery(state.locationId!, {
    scannedItemIds: state.scannedItems.map((i) => i.clothingItem.id),
  })
  const { data: diff, isLoading } = useQuery(previewQuery)

  async function handleConfirm() {
    if (!diff) return
    try {
      await executeMutation.mutateAsync({
        locationId: state.locationId!,
        body: diff,
      })
      onSubmitOk()
    } catch {
      toast.error(
        "Fehler beim Abschließen der Inventarisierung. Bitte erneut versuchen.",
      )
    }
  }

  if (isLoading || !diff) {
    return (
      <div className="space-y-4">
        <p className="text-muted-foreground text-sm">
          Differenzen werden berechnet…
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <DiffSection
        title="Unverändert"
        subtitle="Bereits am Standort"
        items={diff.unchangedItems}
        emptyMessage="Keine unveränderten Kleidungsstücke."
      />

      <DiffSection
        title="Gefunden"
        subtitle="Neu hinzugekommene Kleidung"
        items={diff.foundItems}
        emptyMessage="Keine neu gefundenen Kleidungsstücke."
      />

      <DiffSection
        title="Fehlend"
        subtitle="Werden auf 'Kein Standort' gesetzt"
        items={diff.missingItems}
        emptyMessage="Keine fehlenden Kleidungsstücke."
      />

      <RenderIf when={diff.missingItems.length > 0}>
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
          <p className="text-destructive text-sm font-medium">
            Fehlende Kleidung wird auf &bdquo;Kein Standort&ldquo; gesetzt und
            ist keinem Standort mehr zugeordnet.
          </p>
        </div>
      </RenderIf>

      <div className="flex justify-end gap-3 pt-2">
        <TouchButton
          variant="outline"
          onClick={onBack}
          disabled={executeMutation.isPending}
        >
          ← Zurück
        </TouchButton>
        <TouchButton
          disabled={executeMutation.isPending}
          onClick={() => void handleConfirm()}
        >
          {executeMutation.isPending
            ? "Wird gesendet…"
            : "Inventarisierung abschließen"}
        </TouchButton>
      </div>
    </div>
  )
}

interface DiffSectionProps {
  title: string
  subtitle: string
  items: ResolvedClothingItem[]
  emptyMessage: string
}

function DiffSection({
  title,
  subtitle,
  items,
  emptyMessage,
}: DiffSectionProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-baseline gap-2">
        <p className="text-sm font-semibold">{title}</p>
        <span className="text-muted-foreground text-xs">({items.length})</span>
      </div>
      <p className="text-muted-foreground text-xs">{subtitle}</p>
      <RenderIf when={items.length === 0}>
        <p className="text-muted-foreground text-sm italic">{emptyMessage}</p>
      </RenderIf>
      <RenderIf when={items.length > 0}>
        <div className="space-y-1">
          {items.map((item) => (
            <ClothingItemRow key={item.clothingItem.id} item={item} />
          ))}
        </div>
      </RenderIf>
    </div>
  )
}

// ─── Step 4: Success ─────────────────────────────────────────────────────────

interface StepSuccessContentProps {
  state: ReturnType<typeof useInventoryReconciliationWizard>["state"]
  onReset: () => void
  onNavigateToOverview: () => void
}

function StepSuccessContent({
  state,
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
        <p className="text-lg font-semibold">Inventarisierung abgeschlossen</p>
        <p className="text-muted-foreground text-sm">
          {state.scannedItems.length} Kleidungsstück
          {state.scannedItems.length !== 1 ? "e" : ""} wurden gescannt. Die
          Änderungen wurden übernommen.
        </p>
      </div>
      <p className="text-muted-foreground text-sm">
        Weiterleitung zur Übersicht in {secondsLeft} Sekunde
        {secondsLeft !== 1 ? "n" : ""}…
      </p>
      <div className="flex gap-3">
        <TouchButton onClick={onReset}>
          Neue Inventarisierung starten
        </TouchButton>
        <TouchButton variant="outline" onClick={onNavigateToOverview}>
          Zur Übersicht
        </TouchButton>
      </div>
    </div>
  )
}
