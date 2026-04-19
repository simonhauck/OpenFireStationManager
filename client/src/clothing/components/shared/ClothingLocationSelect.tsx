import { useClothingLocations } from "#/clothing/service/clothingLocationsQueries"
import { Label } from "#/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "#/components/ui/select"

type ClothingLocationSelectProps = {
  selectedLocationId: number | undefined
  onLocationChange: (id: number) => void
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
        value={String(selectedLocationId)}
        onValueChange={(val) => onLocationChange(Number(val))}
      >
        <SelectTrigger id="location">
          <SelectValue placeholder="Kein Standort" />
        </SelectTrigger>
        <SelectContent>
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
