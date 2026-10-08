import { Badge } from "@astryxdesign/core/Badge"
import { Banner } from "@astryxdesign/core/Banner"
import { Button } from "@astryxdesign/core/Button"
import { Card } from "@astryxdesign/core/Card"
import { Heading } from "@astryxdesign/core/Heading"
import { Selector } from "@astryxdesign/core/Selector"
import { Step, Stepper } from "@astryxdesign/core/Stepper"
import { Text } from "@astryxdesign/core/Text"
import { useToast } from "@astryxdesign/core/Toast"
import { VStack } from "@astryxdesign/core/VStack"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"
import type { ReactNode } from "react"
import { useEffect, useState } from "react"

import ClothingItemRow from "#/clothing/components/shared/ClothingItemRow"
import ClothingItemScanner from "#/clothing/components/shared/ClothingItemScanner"
import { formatClothingLocationLabel } from "#/clothing/components/shared/clothingLocationLabel"
import {
  inventoryReconciliationExecuteMutation,
  inventoryReconciliationPreviewQuery,
} from "#/clothing/inventory-reconciliation/service/inventoryReconciliationQueries"
import type { InventoryReconciliationStep } from "#/clothing/inventory-reconciliation/useInventoryReconciliationWizard"
import { useInventoryReconciliationWizard } from "#/clothing/inventory-reconciliation/useInventoryReconciliationWizard"
import type { ResolvedClothingItem } from "#/clothing/model/clothingItems"
import { getAllClothingLocationsQuery } from "#/clothing/service/clothingLocationsQueries"
import PageSection from "#/components/base/PageSection"
import RenderIf from "#/components/base/RenderIf"
import { useMemberNameLookup } from "#/members/service/memberQueries"

const SUCCESS_REDIRECT_SECONDS = 15

interface WizardStep {
  label: string
  description: string
  content: ReactNode
}

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

  const steps: WizardStep[] = [
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
      className="tablet-controls"
      buttons={
        <Button
          label="Abbrechen"
          variant="secondary"
          size="lg"
          onClick={() => {
            void navigate({ to: "/pool-clothing" })
          }}
        />
      }
    >
      <div className="flex items-stretch">
        <aside className="hidden shrink-0 sm:block">
          <div className="pr-6 pb-2">
            <Stepper
              orientation="vertical"
              activeStep={state.step - 1}
              onStepClick={(index) => {
                if (state.step >= steps.length) return
                if (index + 1 < state.step) {
                  goToStep((index + 1) as InventoryReconciliationStep)
                }
              }}
            >
              {steps.map((step, index) => (
                <Step
                  key={step.label}
                  step={index}
                  label={step.label}
                  description={step.description}
                  isDisabled={index + 1 > state.step}
                />
              ))}
            </Stepper>
          </div>
        </aside>

        <div className="min-w-0 flex-1 space-y-4">
          {steps.map((step, index) => {
            const stepNumber = index + 1
            return (
              <RenderIf key={stepNumber} when={state.step === stepNumber}>
                <Card>
                  <VStack gap={4}>
                    <Heading level={2}>
                      Schritt {stepNumber}: {step.label}
                    </Heading>
                    {step.content}
                  </VStack>
                </Card>
              </RenderIf>
            )
          })}
        </div>
      </div>
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
  const memberName = useMemberNameLookup()

  const options = (allLocations ?? []).map((l) => ({
    value: String(l.id),
    label: formatClothingLocationLabel(l, memberName(l.memberId), {
      showType: true,
    }),
  }))

  return (
    <div className="space-y-4">
      <Text type="supporting" as="p">
        Wähle den Standort aus, dessen Bestand überprüft werden soll.
      </Text>
      <Selector
        label="Standort"
        isLabelHidden
        options={options}
        onChange={(value: string) => onSelect(Number(value))}
        hasSearch
        size="lg"
        width="100%"
        placeholder="Standort auswählen..."
        searchPlaceholder="Standort suchen..."
        emptySearchText="Kein Standort gefunden."
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
  const memberName = useMemberNameLookup()

  return (
    <div className="space-y-4">
      <Text type="supporting" as="p">
        Scanne alle Kleidungsstücke, die sich physisch an diesem Standort
        befinden.
      </Text>

      <ClothingItemScanner
        items={state.scannedItems}
        onItemResolved={onAddItem}
        onRemoveItem={onRemoveItem}
        renderItemBadge={(item) =>
          item.location ? (
            <Badge
              variant="neutral"
              label={formatClothingLocationLabel(
                item.location,
                memberName(item.location.memberId),
              )}
            />
          ) : null
        }
      />

      <div className="flex justify-end gap-3 pt-2">
        <Button
          label="← Zurück"
          variant="secondary"
          size="lg"
          onClick={onBack}
        />
        <Button label="Weiter →" variant="primary" size="lg" onClick={onNext} />
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
  const showToast = useToast()
  const executeMutation = useMutation(
    inventoryReconciliationExecuteMutation(queryClient),
  )

  const previewQuery = inventoryReconciliationPreviewQuery(
    state.locationId ?? 0,
    {
      scannedItemIds: state.scannedItems.map((i) => i.clothingItem.id),
    },
  )
  const { data: diff, isLoading } = useQuery({
    ...previewQuery,
    enabled: state.locationId !== null,
  })

  async function handleConfirm() {
    if (!diff || state.locationId === null) return
    try {
      await executeMutation.mutateAsync({
        locationId: state.locationId,
        body: diff,
      })
      onSubmitOk()
    } catch {
      showToast({
        body: "Fehler beim Abschließen der Inventarisierung. Bitte erneut versuchen.",
        type: "error",
        isAutoHide: true,
      })
    }
  }

  if (isLoading || !diff) {
    return (
      <div className="space-y-4">
        <Text type="supporting" as="p">
          Differenzen werden berechnet…
        </Text>
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
        <Banner
          status="warning"
          title={
            "Fehlende Kleidung wird auf \u201eKein Standort\u201c gesetzt und ist keinem Standort mehr zugeordnet."
          }
        />
      </RenderIf>

      <div className="flex justify-end gap-3 pt-2">
        <Button
          label="← Zurück"
          variant="secondary"
          size="lg"
          onClick={onBack}
          isDisabled={executeMutation.isPending}
        />
        <Button
          label={
            executeMutation.isPending
              ? "Wird gesendet…"
              : "Inventarisierung abschließen"
          }
          variant="primary"
          size="lg"
          isDisabled={executeMutation.isPending}
          onClick={() => void handleConfirm()}
        />
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
        <Text as="p" type="label">
          {title}
        </Text>
        <Text as="span" type="supporting">
          ({items.length})
        </Text>
      </div>
      <Text as="p" type="supporting">
        {subtitle}
      </Text>
      <RenderIf when={items.length === 0}>
        <Text type="supporting" as="p" className="italic">
          {emptyMessage}
        </Text>
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
        <Text as="p" type="large" weight="semibold">
          Inventarisierung abgeschlossen
        </Text>
        <Text type="supporting" as="p">
          {state.scannedItems.length} Kleidungsstück
          {state.scannedItems.length !== 1 ? "e" : ""} wurden gescannt. Die
          Änderungen wurden übernommen.
        </Text>
      </div>
      <Text type="supporting" as="p">
        Weiterleitung zur Übersicht in {secondsLeft} Sekunde
        {secondsLeft !== 1 ? "n" : ""}…
      </Text>
      <div className="flex gap-3">
        <Button
          label="Neue Inventarisierung starten"
          variant="primary"
          size="lg"
          onClick={onReset}
        />
        <Button
          label="Zur Übersicht"
          variant="secondary"
          size="lg"
          onClick={onNavigateToOverview}
        />
      </div>
    </div>
  )
}
