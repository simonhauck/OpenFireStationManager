import { AlertDialog } from "@astryxdesign/core/AlertDialog"
import { Badge } from "@astryxdesign/core/Badge"
import { Button } from "@astryxdesign/core/Button"
import { Card } from "@astryxdesign/core/Card"
import { CheckboxListItem } from "@astryxdesign/core/CheckboxList"
import { ClickableCard } from "@astryxdesign/core/ClickableCard"
import { Grid } from "@astryxdesign/core/Grid"
import { Heading } from "@astryxdesign/core/Heading"
import { List } from "@astryxdesign/core/List"
import { Selector } from "@astryxdesign/core/Selector"
import { Step, Stepper } from "@astryxdesign/core/Stepper"
import { Text } from "@astryxdesign/core/Text"
import { useToast } from "@astryxdesign/core/Toast"
import { VStack } from "@astryxdesign/core/VStack"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"
import type { ReactNode } from "react"
import { useEffect, useRef, useState } from "react"

import { autoToggleReturnsByType } from "#/clothing/checkout/autoToggleReturnsByType"
import { checkoutMutation } from "#/clothing/checkout/service/checkoutQueries"
import type { CheckoutStep } from "#/clothing/checkout/useCheckoutWizard"
import { useCheckoutWizard } from "#/clothing/checkout/useCheckoutWizard"
import ClothingItemRow from "#/clothing/components/shared/ClothingItemRow"
import ClothingItemScanner from "#/clothing/components/shared/ClothingItemScanner"
import {
  formatClothingLocationLabel,
  formatClothingLocationLabelOrDefault,
} from "#/clothing/components/shared/clothingLocationLabel"
import type { ResolvedClothingItem } from "#/clothing/model/clothingItems"
import type { ClothingLocation } from "#/clothing/model/clothingLocations"
import { getAllClothingItemsQuery } from "#/clothing/service/clothingItemsQueries"
import { getAllClothingLocationsQuery } from "#/clothing/service/clothingLocationsQueries"
import { getAllClothingTypesQuery } from "#/clothing/service/clothingTypesQueries"
import PageSection from "#/components/base/PageSection"
import RenderIf from "#/components/base/RenderIf"
import { useMemberNameLookup } from "#/members/service/memberQueries"

interface WizardStep {
  label: string
  description: string
  content: ReactNode
}

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

  const steps: WizardStep[] = [
    {
      label: "Spind wählen",
      description: "Wähle deinen Haken / Spind um ihm Klamotten zuzuweisen",
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
          onNext={advanceToReturns}
        />
      ),
    },
    {
      label: "Rückgabe wählen",
      description: "Kleidung aus dem Spind zurückgeben",
      content: (
        <StepReturnTogglesContent
          state={state}
          onSetReturnItemIds={setReturnItemIds}
          onToggleReturnItem={toggleReturnItem}
          onBack={goBack}
          onConfirm={confirmReturns}
        />
      ),
    },
    {
      label: "Wäsche-Ziel wählen",
      description: "Ziel-Wäschekorb auswählen",
      content: <StepWashLocationPickerContent onSelect={selectWashLocation} />,
    },
    {
      label: "Überprüfen",
      description: "Ausgabe und Rückgabe prüfen",
      content: (
        <StepReviewContent
          state={state}
          onSubmitOk={submitOk}
          onBack={goBack}
          onReset={reset}
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

  return (
    <PageSection
      title="Klamotten tauschen"
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
                  goToStep((index + 1) as CheckoutStep)
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

// ─── Step 1: Target Picker ────────────────────────────────────────────────────

interface StepTargetPickerContentProps {
  onSelect: (locationId: number) => void
}

function StepTargetPickerContent({ onSelect }: StepTargetPickerContentProps) {
  const { data: allLocations } = useQuery(getAllClothingLocationsQuery())
  const memberName = useMemberNameLookup()

  const personalLocations = (allLocations ?? []).filter(
    (l) => l.type === "PERSONAL",
  )

  const options = personalLocations.map((l) => ({
    value: String(l.id),
    label: formatClothingLocationLabel(l, memberName(l.memberId)),
  }))

  return (
    <div className="space-y-4">
      <Text type="supporting" as="p">
        Wähle den Spind (PERSONAL-Standort) aus, für den die Ausgabe erfolgt.
      </Text>
      <Selector
        label="Spind"
        isLabelHidden
        options={options}
        onChange={(value: string) => onSelect(Number(value))}
        hasSearch
        size="lg"
        width="100%"
        placeholder="Spind auswählen..."
        searchPlaceholder="Spind suchen..."
        emptySearchText="Kein Spind gefunden."
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
  const memberName = useMemberNameLookup()

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
        actualLocationName: formatClothingLocationLabel(
          location,
          memberName(location.memberId),
        ),
      })
      return
    }

    onAddItem(item)
  }

  return (
    <>
      <div className="space-y-4">
        <Text type="supporting" as="p">
          Scanne einen Barcode oder suche manuell nach einem Kleidungsstück.
        </Text>

        <ClothingItemScanner
          items={state.takeItems}
          onItemResolved={handleItemResolved}
          onRemoveItem={onRemoveItem}
          renderItemBadge={(item) => {
            const loc = item.location
            if (!loc || loc.type === "POOL") return null
            return (
              <Badge
                variant="neutral"
                label={formatClothingLocationLabel(
                  loc,
                  memberName(loc.memberId),
                )}
              />
            )
          }}
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
            isDisabled={state.takeItems.length === 0}
            onClick={onNext}
          />
        </div>
      </div>

      <AlertDialog
        isOpen={pendingConfirmation !== null}
        onOpenChange={(open) => {
          if (!open) setPendingConfirmation(null)
        }}
        title="Kleidungsstück nicht im Pool"
        description={
          pendingConfirmation
            ? `Dieses Kleidungsstück befindet sich laut System bei ${pendingConfirmation.actualLocationName}, nicht in einem Pool. Trotzdem hinzufügen?`
            : ""
        }
        actionLabel="Trotzdem hinzufügen"
        actionVariant="primary"
        onAction={() => {
          if (pendingConfirmation) {
            onAddItem(pendingConfirmation.item)
            setPendingConfirmation(null)
          }
        }}
        cancelLabel="Abbrechen"
      />
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
  }, [lockerItems, onSetReturnItemIds, state.takeItems])

  return (
    <div className="space-y-4">
      <Text type="supporting" as="p">
        Wähle die Kleidungsstücke aus dem Spind aus, die zurückgegeben werden
        sollen. Passende Typen wurden bereits vorausgewählt.
      </Text>

      <RenderIf when={lockerItems.length === 0}>
        <Text type="supporting" as="p" className="italic">
          Keine Kleidung im Spind gefunden.
        </Text>
      </RenderIf>

      <RenderIf when={lockerItems.length > 0}>
        <List hasDividers>
          {lockerItems.map((item) => (
            <CheckboxListItem
              key={item.clothingItem.id}
              label={`${item.clothingType.name} – ${item.clothingItem.size}`}
              description={item.clothingItem.barcode ?? undefined}
              isChecked={state.returnItemIds.has(item.clothingItem.id)}
              onCheck={() => onToggleReturnItem(item.clothingItem.id)}
            />
          ))}
        </List>
      </RenderIf>

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
          onClick={onConfirm}
        />
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
  const memberName = useMemberNameLookup()

  const washLocations: ClothingLocation[] = (allLocations ?? []).filter(
    (l) => l.type === "WAESCHE",
  )

  return (
    <div className="space-y-4">
      <Text type="supporting" as="p">
        Wähle den Wäschekorb aus, in den die zurückgegebene Kleidung soll.
      </Text>

      <RenderIf when={washLocations.length === 0}>
        <Text type="supporting" as="p" className="italic">
          Keine Wäsche-Standorte gefunden.
        </Text>
      </RenderIf>

      <RenderIf when={washLocations.length > 0}>
        <Grid columns={{ minWidth: 180, max: 3 }} gap={3}>
          {washLocations.map((loc) => {
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
  const memberName = useMemberNameLookup()
  const showToast = useToast()

  const typeMap = new Map((allTypes ?? []).map((t) => [t.id, t]))
  const locationMap = new Map((allLocations ?? []).map((l) => [l.id, l]))
  const targetLocation =
    state.targetLocationId !== null
      ? locationMap.get(state.targetLocationId)
      : undefined
  const targetLocationName = formatClothingLocationLabelOrDefault(
    targetLocation,
    memberName(targetLocation?.memberId),
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
  const washLocationName = formatClothingLocationLabelOrDefault(
    location,
    memberName(location?.memberId),
  )

  async function handleSubmit() {
    if (state.targetLocationId === null) return
    const body = {
      targetLocationId: state.targetLocationId,
      takeItemIds: state.takeItems.map((i) => i.clothingItem.id),
      returnItemIds: [...state.returnItemIds],
      returnLocationId: state.returnLocationId ?? undefined,
    }
    try {
      await checkout.mutateAsync(body)
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
          Ausgabe ({state.takeItems.length})
        </Text>
        <RenderIf when={state.takeItems.length === 0}>
          <Text type="supporting" as="p" className="italic">
            Keine Kleidung ausgewählt.
          </Text>
        </RenderIf>
        <RenderIf when={state.takeItems.length > 0}>
          <div className="space-y-1">
            {state.takeItems.map((item) => (
              <ClothingItemRow key={item.clothingItem.id} item={item} />
            ))}
          </div>
          <Text type="supporting" as="p">
            Ziel: <strong>{targetLocationName}</strong>
          </Text>
        </RenderIf>
      </div>

      <div className="space-y-2">
        <Text as="p" type="label">
          Rückgabe ({returnItems.length})
        </Text>
        <RenderIf when={returnItems.length === 0}>
          <Text type="supporting" as="p" className="italic">
            Keine Rückgabe.
          </Text>
        </RenderIf>
        <RenderIf when={returnItems.length > 0}>
          <div className="space-y-1">
            {returnItems.map((item) => (
              <ClothingItemRow key={item.clothingItem.id} item={item} />
            ))}
          </div>
          <Text type="supporting" as="p">
            Ziel: <strong>{washLocationName}</strong>
          </Text>
        </RenderIf>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button
          label="← Zurück"
          variant="secondary"
          size="lg"
          onClick={onBack}
          isDisabled={checkout.isPending}
        />
        <Button
          label={checkout.isPending ? "Wird gesendet…" : "Bestätigen"}
          variant="primary"
          size="lg"
          isDisabled={checkout.isPending}
          onClick={() => void handleSubmit()}
        />
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
        <Text as="p" type="large" weight="semibold">
          Vorgang abgeschlossen
        </Text>
        <Text type="supporting" as="p">
          Die Ausgabe wurde erfolgreich abgeschlossen. Alle Kleidungsstücke
          wurden korrekt verbucht.
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
