import type { ClothingLocation } from "#/clothing/model/clothingLocations"

type LocationType = ClothingLocation["type"]

const LOCATION_TYPE_LABELS: Record<LocationType, string> = {
  POOL: "Pool",
  WAESCHE: "Wäsche",
  PERSONAL: "Persönlicher Standort",
  OTHER: "Sonstiges",
}

interface FormatClothingLocationLabelOptions {
  showType?: boolean
}

export function formatClothingLocationLabel(
  location: Pick<ClothingLocation, "name" | "comment" | "type">,
  memberName: string | undefined,
  { showType = false }: FormatClothingLocationLabelOptions = {},
): string {
  let label = location.name

  if (memberName) {
    label += ` – ${memberName}`
  }

  if (location.comment) {
    label += ` – ${location.comment}`
  }

  if (showType) {
    label += ` (${LOCATION_TYPE_LABELS[location.type]})`
  }

  return label
}

export function formatClothingLocationLabelOrDefault(
  location: Pick<ClothingLocation, "name" | "comment" | "type"> | undefined,
  memberName: string | undefined,
  options: FormatClothingLocationLabelOptions = {},
  defaultValue = "–",
): string {
  return location
    ? formatClothingLocationLabel(location, memberName, options)
    : defaultValue
}
