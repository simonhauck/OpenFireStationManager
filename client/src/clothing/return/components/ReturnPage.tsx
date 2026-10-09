import { Button } from "@astryxdesign/core/Button"
import { Card } from "@astryxdesign/core/Card"
import { ClickableCard } from "@astryxdesign/core/ClickableCard"
import { Grid } from "@astryxdesign/core/Grid"
import { Heading } from "@astryxdesign/core/Heading"
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
import {
  formatClothingLocationLabel,
  formatClothingLocationLabelOrDefault,
} from "#/clothing/components/shared/clothingLocationLabel"
import type { CheckoutRequest } from "#/clothing/model/checkout"
import type { ResolvedClothingItem } from "#/clothing/model/clothingItems"
import type { ClothingLocation } from "#/clothing/model/clothingLocations"
import { LockerItemDialog } from "#/clothing/return/components/LockerItemDialog"
import { returnMutation } from "#/clothing/return/service/returnQueries"
import type { ReturnStep } from "#/clothing/return/useReturnWizard"
import { useReturnWizard } from "#/clothing/return/useReturnWizard"
import { getAllClothingLocationsQuery } from "#/clothing/service/clothingLocationsQueries"
import PageSection from "#/components/base/PageSection"
import RenderIf from "#/components/base/RenderIf"
import { useMemberNameLookup } from "#/members/service/memberQueries"

interface WizardStep {
  label: string
  description: string
  content: ReactNode
}

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
    locationType === "POOL"
      ? "Klamotten in den Pool geben"
      : "Klamotten in die Wäsche geben"

  const { data: allLocations } = useQuery(getAllClothingLocationsQuery())
  const targets = (allLocations ?? []).filter((l) => l.type === locationType)

  const steps: WizardStep[] = [
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
      <PageSection title={title} className="tablet-controls">
        <Text type="supporting" as="p">
          {locationType === "WAESCHE"
            ? "Keine Wäsche-Standorte eingerichtet."
            : "Keine Pool-Standorte eingerichtet."}
        </Text>
      </PageSection>
    )
  }

  return (
    <PageSection
      title={title}
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
                  goToStep((index + 1) as ReturnStep)
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
        <Button
          variant={activeTab === "scanner" ? "primary" : "ghost"}
          size="lg"
          width="100%"
          label="Scannen"
          onClick={() => setActiveTab("scanner")}
        />
        <Button
          variant={activeTab === "locker" ? "primary" : "ghost"}
          size="lg"
          width="100%"
          label="Aus Spind auswählen"
          onClick={() => setDialogOpen(true)}
        />
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
        <Button
          label="Weiter →"
          variant="primary"
          size="lg"
          isDisabled={state.returnItems.length === 0}
          onClick={onNext}
        />
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
  const memberName = useMemberNameLookup()
  const description =
    locationType === "POOL"
      ? "Wähle den Pool-Standort aus, in den die Kleidung zurückgegeben wird."
      : "Wähle den Wäschekorb aus, in den die Kleidung soll."

  return (
    <div className="space-y-4">
      <Text type="supporting" as="p">
        {description}
      </Text>

      <Grid columns={{ minWidth: 180, max: 3 }} gap={3}>
        {targets.map((loc) => {
          const label = formatClothingLocationLabel(
            loc,
            memberName(loc.memberId),
          )
          return (
            <ClickableCard
              key={loc.id}
              label={label}
              width="100%"
              onClick={() => onSelect(loc.id)}
            >
              <Text weight="medium">{label}</Text>
            </ClickableCard>
          )
        })}
      </Grid>
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
  const memberName = useMemberNameLookup()
  const showToast = useToast()

  const locationMap = new Map(allLocations.map((l) => [l.id, l]))
  const returnLocationId = state.returnLocationId
  const returnLocation =
    returnLocationId != null ? locationMap.get(returnLocationId) : undefined
  const targetName = formatClothingLocationLabelOrDefault(
    returnLocation,
    memberName(returnLocation?.memberId),
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
      showToast({
        body: "Fehler beim Abschließen des Vorgangs. Bitte erneut versuchen.",
        type: "error",
        isAutoHide: true,
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Text as="p" type="label">
          Rückgabe ({state.returnItems.length})
        </Text>
        <RenderIf when={state.returnItems.length === 0}>
          <Text type="supporting" as="p" className="italic">
            Keine Kleidung ausgewählt.
          </Text>
        </RenderIf>
        <RenderIf when={state.returnItems.length > 0}>
          <div className="space-y-1">
            {state.returnItems.map((item) => (
              <ClothingItemRow key={item.clothingItem.id} item={item} />
            ))}
          </div>
          <Text type="supporting" as="p">
            Ziel: <strong>{targetName}</strong>
          </Text>
        </RenderIf>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button
          label="← Zurück"
          variant="secondary"
          size="lg"
          onClick={onBack}
          isDisabled={mutation.isPending}
        />
        <Button
          label={mutation.isPending ? "Wird gesendet…" : "Bestätigen"}
          variant="primary"
          size="lg"
          isDisabled={mutation.isPending}
          onClick={() => void handleSubmit()}
        />
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
        <Text as="p" type="large" weight="semibold">
          Vorgang abgeschlossen
        </Text>
        <Text type="supporting" as="p">
          Die Rückgabe wurde erfolgreich abgeschlossen.
        </Text>
      </div>
      <Text type="supporting" as="p">
        Weiterleitung zur Übersicht in {secondsLeft} Sekunde
        {secondsLeft !== 1 ? "n" : ""}…
      </Text>
      <div className="flex gap-3">
        <Button
          label="Neuen Vorgang starten"
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
