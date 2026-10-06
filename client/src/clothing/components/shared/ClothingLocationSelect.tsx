import { formatClothingLocationLabel } from "#/clothing/components/shared/clothingLocationLabel"
import type { ClothingLocation } from "#/clothing/model/clothingLocations"
import { useClothingLocations } from "#/clothing/service/clothingLocationsQueries"
import ClearableSelect from "#/components/base/ClearableSelect"
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
  const selectedLocation: ClothingLocation | undefined = locations.find(
    (l) => l.id === selectedLocationId,
  )

  return (
    <ClearableSelect<ClothingLocation>
      id="location"
      label="Standort (optional)"
      noItemSelectedLabel="--- Kein Standort / Unbekannt ---"
      canClear={true}
      options={locations}
      selectedValue={selectedLocation}
      onValueChange={(location) => onLocationChange(location?.id)}
      toDisplayString={(location) =>
        formatClothingLocationLabel(location, memberName(location.memberId))
      }
      toKey={(location) => String(location.id)}
    />
  )
}
