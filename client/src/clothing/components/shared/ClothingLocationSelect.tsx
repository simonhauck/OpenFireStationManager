import { Selector } from "@astryxdesign/core/Selector"

import { formatClothingLocationLabel } from "#/clothing/components/shared/clothingLocationLabel"
import type { ClothingLocation } from "#/clothing/model/clothingLocations"
import { useClothingLocations } from "#/clothing/service/clothingLocationsQueries"
import { useMemberNameLookup } from "#/members/service/memberQueries"

type ClothingLocationSelectProps = {
  selectedLocationId: number | undefined
  onLocationChange: (id: number | undefined) => void
}

export default function ClothingLocationSelect({
  selectedLocationId,
  onLocationChange,
}: ClothingLocationSelectProps) {
  const { data: clothingLocations } = useClothingLocations()
  const memberName = useMemberNameLookup()

  const locations: ClothingLocation[] = clothingLocations ?? []

  return (
    <Selector
      label="Standort (optional)"
      options={locations.map((location) => ({
        value: String(location.id),
        label: formatClothingLocationLabel(
          location,
          memberName(location.memberId),
        ),
      }))}
      value={
        selectedLocationId === undefined ? null : String(selectedLocationId)
      }
      onChange={(value) =>
        onLocationChange(value === null ? undefined : Number(value))
      }
      hasClear
      placeholder="--- Kein Standort / Unbekannt ---"
      width="100%"
    />
  )
}
