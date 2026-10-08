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
import { useMemberNameLookup } from "#/members/service/memberQueries"

const SUCCESS_REDIRECT_SECONDS = 15

interface WizardStep {
  label: string
  description: string
  content: ReactNode
}

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

  const steps: WizardStep[] = [
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
            <Stepper orientation="vertical" activeStep={state.step - 1}>
              {steps.map((step, index) => (
                <Step
                  key={step.label}
                  step={index}
                  label={step.label}
                  description={step.description}
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

// ─── Step 1: Target Picker ────────────────────────────────────────────────────

interface StepTargetPickerContentProps {
  onSelect: (locationId: number) => void
}

function StepTargetPickerContent({ onSelect }: StepTargetPickerContentProps) {
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
        Wähle den Ziel-Standort aus, an den die Kleidung umgelagert werden soll.
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
      <Text type="supporting" as="p">
        Scanne einen Barcode oder suche manuell nach einem Kleidungsstück.
      </Text>

      <ClothingItemScanner
        items={state.items}
        onItemResolved={onAddItem}
        onRemoveItem={onRemoveItem}
      />

      <div className="flex justify-end gap-3 pt-2">
        <Button
          label="← Zurück"
          variant="secondary"
          size="lg"
          onClick={onBack}
        />
        <Button
          label="Weiter →"
          variant="primary"
          size="lg"
          isDisabled={state.items.length === 0}
          onClick={onNext}
        />
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
  const memberName = useMemberNameLookup()
  const showToast = useToast()

  const locationMap = new Map((allLocations ?? []).map((l) => [l.id, l]))
  const location =
    state.targetLocationId !== null
      ? locationMap.get(state.targetLocationId)
      : undefined
  const targetLocationName = formatClothingLocationLabelOrDefault(
    location,
    memberName(location?.memberId),
    { showType: true },
  )

  async function handleSubmit() {
    if (state.targetLocationId === null) return
    try {
      await relocate.mutateAsync({
        targetLocationId: state.targetLocationId,
        itemIds: state.items.map((i) => i.clothingItem.id),
      })
      onSubmitOk()
    } catch {
      showToast({
        body: "Fehler beim Abschließen der Umlagerung. Bitte erneut versuchen.",
        type: "error",
        isAutoHide: true,
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Text as="p" type="label">
          Ziel-Standort:{" "}
          <Text as="span" type="inherit">
            {targetLocationName}
          </Text>
        </Text>
      </div>

      <div className="space-y-2">
        <Text as="p" type="label">
          Kleidung ({state.items.length})
        </Text>
        <RenderIf when={state.items.length === 0}>
          <Text type="supporting" as="p" className="italic">
            Keine Kleidung ausgewählt.
          </Text>
        </RenderIf>
        <RenderIf when={state.items.length > 0}>
          <div className="space-y-1">
            {state.items.map((item) => (
              <ClothingItemRow key={item.clothingItem.id} item={item} />
            ))}
          </div>
        </RenderIf>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button
          label="← Zurück"
          variant="secondary"
          size="lg"
          onClick={onBack}
          isDisabled={relocate.isPending}
        />
        <Button
          label={relocate.isPending ? "Wird gesendet…" : "Bestätigen"}
          variant="primary"
          size="lg"
          isDisabled={relocate.isPending || state.items.length === 0}
          onClick={() => void handleSubmit()}
        />
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
  const memberName = useMemberNameLookup()
  const [secondsLeft, setSecondsLeft] = useState(SUCCESS_REDIRECT_SECONDS)

  const locationMap = new Map((allLocations ?? []).map((l) => [l.id, l]))
  const targetLocation =
    state.targetLocationId !== null
      ? locationMap.get(state.targetLocationId)
      : undefined
  const targetLocationName = formatClothingLocationLabelOrDefault(
    targetLocation,
    memberName(targetLocation?.memberId),
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
        <Text as="p" type="large" weight="semibold">
          Umlagerung abgeschlossen
        </Text>
        <Text type="supporting" as="p">
          {state.items.length} Kleidungsstück
          {state.items.length !== 1 ? "e" : ""} wurde
          {state.items.length !== 1 ? "n" : ""} erfolgreich nach{" "}
          <strong>{targetLocationName}</strong> umgelagert.
        </Text>
      </div>
      <Text type="supporting" as="p">
        Weiterleitung zur Übersicht in {secondsLeft} Sekunde
        {secondsLeft !== 1 ? "n" : ""}…
      </Text>
      <div className="flex gap-3">
        <Button
          label="Neue Umlagerung starten"
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
