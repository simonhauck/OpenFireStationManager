import type { components } from "#/api/schema"

export type ClothingLocation = components["schemas"]["ClothingLocation"]

export type CreateClothingLocationRequest =
  components["schemas"]["CreateClothingLocationRequest"]

export type BatchCreateClothingLocationsRequest =
  components["schemas"]["BatchCreateClothingLocationsRequest"]

export type LocationType = CreateClothingLocationRequest["type"]
