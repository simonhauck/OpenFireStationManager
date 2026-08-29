import type { ClothingLocation } from "#/clothing/model/clothingLocations"
import { useClothingLocations } from "#/clothing/service/clothingLocationsQueries"
import ClearableSelect from "#/components/base/ClearableSelect"

type ClothingLocationSelectProps = {
  selectedLocationId: number | undefined
  onLocationChange: (id: number | undefined) => void
}

export default function ClothingLocationSelect({
  selectedLocationId,
  onLocationChange,
}: ClothingLocationSelectProps) {
  const { data: clothingLocations } = useClothingLocations()

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
      toDisplayString={(location) => location.name}
      toKey={(location) => String(location.id)}
    />
  )
}
