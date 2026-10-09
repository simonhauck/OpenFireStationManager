import { Button } from "@astryxdesign/core/Button"
import { CheckboxListItem } from "@astryxdesign/core/CheckboxList"
import { Dialog, DialogHeader } from "@astryxdesign/core/Dialog"
import { List } from "@astryxdesign/core/List"
import { Selector } from "@astryxdesign/core/Selector"
import { Text } from "@astryxdesign/core/Text"
import { VStack } from "@astryxdesign/core/VStack"
import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { formatClothingLocationLabel } from "#/clothing/components/shared/clothingLocationLabel"
import type { ResolvedClothingItem } from "#/clothing/model/clothingItems.ts"
import { getAllClothingItemsQuery } from "#/clothing/service/clothingItemsQueries"
import { getAllClothingLocationsQuery } from "#/clothing/service/clothingLocationsQueries"
import { getAllClothingTypesQuery } from "#/clothing/service/clothingTypesQueries"
import RenderIf from "#/components/base/RenderIf"
import { useMemberNameLookup } from "#/members/service/memberQueries"

interface LockerItemDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Items already in the return list — used to disable duplicates. */
  existingItemIds: Set<number>
  /** Called when the user confirms their selection. */
  onAddItems: (items: ResolvedClothingItem[]) => void
}

export function LockerItemDialog({
  open,
  onOpenChange,
  existingItemIds,
  onAddItems,
}: LockerItemDialogProps) {
  const { data: allLocations } = useQuery(getAllClothingLocationsQuery())
  const { data: allItems } = useQuery(getAllClothingItemsQuery())
  const { data: allTypes } = useQuery(getAllClothingTypesQuery())
  const memberName = useMemberNameLookup()

  const [selectedLocationId, setSelectedLocationId] = useState<number | null>(
    null,
  )
  const [checkedIds, setCheckedIds] = useState<Set<number>>(new Set())

  // Reset state when dialog opens
  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setSelectedLocationId(null)
      setCheckedIds(new Set())
    }
    onOpenChange(nextOpen)
  }

  const personalLocations = (allLocations ?? [])
    .filter((l) => l.type === "PERSONAL")
    .map((l) => ({
      value: String(l.id),
      label: formatClothingLocationLabel(l, memberName(l.memberId)),
    }))

  // Items at selected PERSONAL location
  const typeMap = new Map((allTypes ?? []).map((t) => [t.id, t]))
  const lockerItems: ResolvedClothingItem[] = selectedLocationId
    ? (allItems ?? [])
        .filter((i) => i.locationId === selectedLocationId)
        .flatMap((i) => {
          const type = typeMap.get(i.typeId)
          if (!type) return []
          return [{ clothingItem: i, clothingType: type }]
        })
    : []

  function toggleCheck(id: number) {
    setCheckedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function handleConfirm() {
    const selected = lockerItems
      .filter((li) => checkedIds.has(li.clothingItem.id))
      .filter((li) => !existingItemIds.has(li.clothingItem.id))
    if (selected.length > 0) {
      onAddItems(selected)
    }
    handleOpenChange(false)
  }

  return (
    <Dialog
      isOpen={open}
      onOpenChange={handleOpenChange}
      width={512}
      purpose="form"
    >
      <VStack gap={4}>
        <DialogHeader
          title="Aus Spind auswählen"
          onOpenChange={handleOpenChange}
        />

        <Selector
          label="Spind"
          isLabelHidden
          options={personalLocations}
          value={
            selectedLocationId !== null ? String(selectedLocationId) : undefined
          }
          onChange={(value: string) => {
            setSelectedLocationId(Number(value))
            setCheckedIds(new Set())
          }}
          hasSearch
          size="lg"
          width="100%"
          placeholder="Spind auswählen..."
          searchPlaceholder="Spind suchen..."
          emptySearchText="Kein Spind gefunden."
        />

        <RenderIf
          when={selectedLocationId !== null && lockerItems.length === 0}
        >
          <Text type="supporting" as="p" className="italic">
            Keine Kleidung in diesem Spind.
          </Text>
        </RenderIf>

        <RenderIf when={lockerItems.length > 0}>
          <List hasDividers>
            {lockerItems.map((item) => {
              const alreadyAdded = existingItemIds.has(item.clothingItem.id)
              return (
                <CheckboxListItem
                  key={item.clothingItem.id}
                  label={`${item.clothingType.name} – ${item.clothingItem.size}`}
                  description={item.clothingItem.barcode ?? undefined}
                  isChecked={
                    alreadyAdded || checkedIds.has(item.clothingItem.id)
                  }
                  isDisabled={alreadyAdded}
                  onCheck={() => toggleCheck(item.clothingItem.id)}
                />
              )
            })}
          </List>
        </RenderIf>

        <div className="flex justify-end gap-3 pt-2">
          <Button
            label="Abbrechen"
            variant="secondary"
            size="lg"
            onClick={() => handleOpenChange(false)}
          />
          <Button
            label="Hinzufügen"
            variant="primary"
            size="lg"
            isDisabled={checkedIds.size === 0}
            onClick={handleConfirm}
          />
        </div>
      </VStack>
    </Dialog>
  )
}
