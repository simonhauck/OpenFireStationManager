import { Button } from "@astryxdesign/core/Button"
import { Card } from "@astryxdesign/core/Card"
import { CheckboxListItem } from "@astryxdesign/core/CheckboxList"
import { ClickableCard } from "@astryxdesign/core/ClickableCard"
import { Grid } from "@astryxdesign/core/Grid"
import { Heading } from "@astryxdesign/core/Heading"
import { IconButton } from "@astryxdesign/core/IconButton"
import { List } from "@astryxdesign/core/List"
import { Selector } from "@astryxdesign/core/Selector"
import { Step, Stepper } from "@astryxdesign/core/Stepper"
import { Text } from "@astryxdesign/core/Text"
import { useToast } from "@astryxdesign/core/Toast"
import { Token } from "@astryxdesign/core/Token"
import { VStack } from "@astryxdesign/core/VStack"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"
import {
  ArrowRightLeftIcon,
  MapPinIcon,
  MapPinOffIcon,
  Trash2Icon,
} from "lucide-react"
import type { ReactNode } from "react"
import { useEffect, useMemo, useState } from "react"

import { autoToggleReturnsByType } from "#/clothing/checkout/autoToggleReturnsByType"
import type { CheckoutStep } from "#/clothing/checkout/combined/useCheckoutWizard"
import { useCheckoutWizard } from "#/clothing/checkout/combined/useCheckoutWizard"
import { useResolvedClothingItems } from "#/clothing/checkout/combined/useResolvedClothingItems"
import { checkoutMutation } from "#/clothing/checkout/service/checkoutQueries"
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
    moveItemToReturn,
    moveItemToTake,
    reconcileSuggestedReturns,
    toggleReturnItem,
    advanceFromSwap,
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
      description: "Ausgabe und Rückgabe – die App sortiert automatisch",
      content: (
        <StepSwapContent
          state={state}
          onAddItem={addItem}
          onRemoveItem={removeItem}
          onMoveItemToReturn={moveItemToReturn}
          onMoveItemToTake={moveItemToTake}
          onReconcileSuggestedReturns={reconcileSuggestedReturns}
          onToggleReturnItem={toggleReturnItem}
          onBack={goBack}
          onNext={advanceFromSwap}
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

// ─── Step 2: Combined Ausgabe / Rückgabe ─────────────────────────────────────

interface StepSwapContentProps {
  state: ReturnType<typeof useCheckoutWizard>["state"]
  onAddItem: (item: ResolvedClothingItem) => void
  onRemoveItem: (itemId: number) => void
  onMoveItemToReturn: (item: ResolvedClothingItem) => void
  onMoveItemToTake: (item: ResolvedClothingItem) => void
  onReconcileSuggestedReturns: (suggestedIds: Set<number>) => void
  onToggleReturnItem: (itemId: number) => void
  onBack: () => void
  onNext: () => void
}

function StepSwapContent({
  state,
  onAddItem,
  onRemoveItem,
  onMoveItemToReturn,
  onMoveItemToTake,
  onReconcileSuggestedReturns,
  onToggleReturnItem,
  onBack,
  onNext,
}: StepSwapContentProps) {
  const { data: allLocations } = useQuery(getAllClothingLocationsQuery())
  const memberName = useMemberNameLookup()
  const resolvedItems = useResolvedClothingItems()

  const targetLocation = (allLocations ?? []).find(
    (l) => l.id === state.targetLocationId,
  )
  const targetLocationName = formatClothingLocationLabelOrDefault(
    targetLocation,
    memberName(targetLocation?.memberId),
  )

  const lockerItems = useMemo(
    () =>
      resolvedItems.filter(
        (i) => i.clothingItem.locationId === state.targetLocationId,
      ),
    [resolvedItems, state.targetLocationId],
  )

  const selectedReturnItems = useMemo(
    () =>
      [...state.returnItemIds].flatMap((id) => {
        const resolved = resolvedItems.find((i) => i.clothingItem.id === id)
        return resolved ? [resolved] : []
      }),
    [resolvedItems, state.returnItemIds],
  )

  // Returns that are not recorded at the target locker: items whose current
  // location disagrees with the target, forced to return via "Zurückgeben".
  const foreignReturnItems = useMemo(
    () =>
      selectedReturnItems.filter(
        (i) => i.clothingItem.locationId !== state.targetLocationId,
      ),
    [selectedReturnItems, state.targetLocationId],
  )

  const suggestedReturnIds = useMemo(
    () => autoToggleReturnsByType(state.takeItems, lockerItems),
    [state.takeItems, lockerItems],
  )

  useEffect(() => {
    onReconcileSuggestedReturns(suggestedReturnIds)
  }, [onReconcileSuggestedReturns, suggestedReturnIds])

  function handleItemResolved(item: ResolvedClothingItem) {
    const isAtTarget = item.clothingItem.locationId === state.targetLocationId
    if (isAtTarget) {
      // Items already recorded at the target locker are return candidates.
      onMoveItemToReturn(item)
      return
    }
    onAddItem(item)
  }

  const canAdvance = state.takeItems.length > 0 || state.returnItemIds.size > 0

  return (
    <>
      <div className="space-y-4">
        <Text type="supporting" as="p">
          Einfach scannen – die App sortiert automatisch: neue Kleidung links
          unter Ausgabe, Kleidung aus dem Spind rechts unter Rückgabe. Jedes
          Teil lässt sich per Knopf verschieben.
        </Text>

        <ClothingItemScanner
          items={state.takeItems}
          onItemResolved={handleItemResolved}
          onRemoveItem={onRemoveItem}
          showItemList={false}
        />
      </div>

      <Grid columns={{ minWidth: 320, max: 2 }} gap={4}>
        <div className="space-y-2" data-testid="checkout-ausgabe">
          <Text as="p" type="label">
            Ausgabe ({state.takeItems.length})
          </Text>
          <RenderIf when={state.takeItems.length === 0}>
            <Text type="supporting" as="p" className="italic">
              Noch nichts erfasst – scanne Kleidung zum Mitnehmen.
            </Text>
          </RenderIf>
          <RenderIf when={state.takeItems.length > 0}>
            <div className="space-y-2">
              {state.takeItems.map((item) => (
                <ClothingItemRow
                  key={item.clothingItem.id}
                  item={item}
                  trailing={
                    <div className="flex items-center gap-2">
                      <ItemOriginToken item={item} />
                      <IconButton
                        variant="ghost"
                        size="lg"
                        label={`${item.clothingType.name} zur Rückgabe verschieben`}
                        tooltip="Zur Rückgabe verschieben"
                        icon={<ArrowRightLeftIcon className="size-4" />}
                        onClick={() => onMoveItemToReturn(item)}
                      />
                      <IconButton
                        variant="ghost"
                        size="lg"
                        label={`${item.clothingType.name} entfernen`}
                        tooltip="Entfernen"
                        icon={<Trash2Icon className="size-4" />}
                        onClick={() => onRemoveItem(item.clothingItem.id)}
                      />
                    </div>
                  }
                />
              ))}
            </div>
          </RenderIf>
        </div>

        <div className="space-y-2" data-testid="checkout-rueckgabe">
          <Text as="p" type="label">
            Rückgabe ({state.returnItemIds.size})
          </Text>
          <Text type="supporting" as="p">
            Alle Kleidungsstücke in {targetLocationName}
          </Text>
          <RenderIf
            when={lockerItems.length === 0 && foreignReturnItems.length === 0}
          >
            <Text type="supporting" as="p" className="italic">
              Keine Kleidung im Spind.
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
          <RenderIf when={foreignReturnItems.length > 0}>
            <div className="space-y-2 border-t pt-3">
              <Text as="p" type="label">
                Nicht im Spind
              </Text>
              <div className="space-y-2">
                {foreignReturnItems.map((item) => (
                  <ClothingItemRow
                    key={item.clothingItem.id}
                    item={item}
                    trailing={
                      <div className="flex items-center gap-2">
                        <ItemOriginToken item={item} />
                        <IconButton
                          variant="ghost"
                          size="lg"
                          label={`${item.clothingType.name} zur Ausgabe verschieben`}
                          tooltip="Zur Ausgabe verschieben"
                          icon={<ArrowRightLeftIcon className="size-4" />}
                          onClick={() => onMoveItemToTake(item)}
                        />
                      </div>
                    }
                  />
                ))}
              </div>
            </div>
          </RenderIf>
        </div>
      </Grid>

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
          isDisabled={!canAdvance}
          onClick={onNext}
        />
      </div>
    </>
  )
}

/**
 * Chip for a non-POOL origin, so the recorded location is visible inline
 * instead of in a modal. Renders nothing for pool items, where the origin is
 * the expected one.
 */
function ItemOriginToken({ item }: { item: ResolvedClothingItem }) {
  const memberName = useMemberNameLookup()
  const location = item.location

  if (location && location.type === "POOL") return null

  if (!location) {
    return (
      <Token
        label="Kein Standort"
        color="orange"
        icon={<MapPinOffIcon className="size-4" />}
      />
    )
  }

  return (
    <Token
      label={formatClothingLocationLabel(
        location,
        memberName(location.memberId),
      )}
      color="orange"
      icon={<MapPinIcon className="size-4" />}
    />
  )
}

// ─── Step 3: Wash Location Picker ─────────────────────────────────────────────

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

// ─── Step 4: Review + Submit ──────────────────────────────────────────────────

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

// ─── Step 5: Success ──────────────────────────────────────────────────────────

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
