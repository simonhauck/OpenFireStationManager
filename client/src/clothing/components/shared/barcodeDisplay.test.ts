import { describe, expect, it } from "vitest"
import type { ClothingItem } from "#/clothing/model/clothingItems.ts"
import { displayBarcode } from "./barcodeDisplay"

function item(barcode?: string, manufacturerBarcode?: string): ClothingItem {
  return {
    id: 1,
    typeId: 1,
    size: "L",
    barcode,
    manufacturerBarcode,
  } as ClothingItem
}

describe("displayBarcode", () => {
  it("returns the station barcode when present", () => {
    expect(displayBarcode(item("STATION", "MANUFACTURER"))).toBe("STATION")
  })

  it("falls back to the manufacturer barcode", () => {
    expect(displayBarcode(item(undefined, "MANUFACTURER"))).toBe("MANUFACTURER")
  })

  it("returns undefined when neither barcode is set", () => {
    expect(displayBarcode(item())).toBeUndefined()
  })
})
