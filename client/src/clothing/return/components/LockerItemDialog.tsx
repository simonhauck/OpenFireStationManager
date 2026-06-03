import { useQuery } from "@tanstack/react-query"
import { useState } from "react"

import { getAllClothingLocationsQuery } from "#/clothing/service/clothingLocationsQueries"
import { getAllClothingItemsQuery } from "#/clothing/service/clothingItemsQueries"
import { getAllClothingTypesQuery } from "#/clothing/service/clothingTypesQueries"
import { formatClothingLocationLabel } from "#/clothing/components/shared/clothingLocationLabel"
import type { ResolvedClothingItem } from "#/clothing/checkout/autoToggleReturnsByType"
import {
  TouchButton,
  TouchCombobox,
} from "#/clothing/checkout/components/TouchComponents"
import type { ComboboxOption } from "#/clothing/checkout/components/TouchComponents"
import ClothingItemRow from "#/clothing/components/shared/ClothingItemRow"
import RenderIf from "#/components/base/RenderIf"
import { Checkbox } from "#/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "#/components/ui/dialog"

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

  const personalLocations: ComboboxOption[] = (allLocations ?? [])
    .filter((l) => l.type === "PERSONAL")
    .map((l) => ({
      value: String(l.id),
      label: formatClothingLocationLabel(l),
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
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Aus Spind auswählen</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <TouchCombobox
            options={personalLocations}
            value={
              selectedLocationId !== null ? String(selectedLocationId) : null
            }
            onSelect={(value) => {
              setSelectedLocationId(Number(value))
              setCheckedIds(new Set())
            }}
            placeholder="Spind auswählen..."
            searchPlaceholder="Spind suchen..."
            emptyMessage="Kein Spind gefunden."
          />

          <RenderIf
            when={selectedLocationId !== null && lockerItems.length === 0}
          >
            <p className="text-muted-foreground text-sm italic">
              Keine Kleidung in diesem Spind.
            </p>
          </RenderIf>

          <RenderIf when={lockerItems.length > 0}>
            <div className="space-y-2">
              {lockerItems.map((item) => {
                const alreadyAdded = existingItemIds.has(item.clothingItem.id)
                return (
                  <ClothingItemRow
                    key={item.clothingItem.id}
                    item={item}
                    asLabel
                    leading={
                      <Checkbox
                        checked={
                          alreadyAdded || checkedIds.has(item.clothingItem.id)
                        }
                        disabled={alreadyAdded}
                        onCheckedChange={() =>
                          toggleCheck(item.clothingItem.id)
                        }
                        className="size-5"
                      />
                    }
                  />
                )
              })}
            </div>
          </RenderIf>

          <div className="flex justify-end gap-3 pt-2">
            <TouchButton
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              Abbrechen
            </TouchButton>
            <TouchButton
              disabled={checkedIds.size === 0}
              onClick={handleConfirm}
            >
              Hinzufügen
            </TouchButton>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
