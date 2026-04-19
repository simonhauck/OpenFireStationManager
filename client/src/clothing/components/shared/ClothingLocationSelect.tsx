import { useClothingLocations } from "#/clothing/service/clothingLocationsQueries"
import { Label } from "#/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "#/components/ui/select"

const NO_LOCATION_VALUE = "__none__"

type ClothingLocationSelectProps = {
  selectedLocationId: string
  onLocationChange: (id: string) => void
}

export default function ClothingLocationSelect({
  selectedLocationId,
  onLocationChange,
}: ClothingLocationSelectProps) {
  const { data: clothingLocations } = useClothingLocations()

  const locations = clothingLocations ?? []

  return (
    <div className="space-y-1.5">
      <Label htmlFor="location">Standort (optional)</Label>
      <Select
        value={selectedLocationId}
        onValueChange={(val) =>
          onLocationChange(val === NO_LOCATION_VALUE ? "" : val)
        }
      >
        <SelectTrigger id="location">
          <SelectValue placeholder="Kein Standort" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={NO_LOCATION_VALUE}>Kein Standort</SelectItem>
          {locations.map((location) => (
            <SelectItem key={location.id} value={String(location.id)}>
              {location.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
