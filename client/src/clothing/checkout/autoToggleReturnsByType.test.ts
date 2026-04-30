import { describe, expect, it } from "vitest"
import { autoToggleReturnsByType } from "./autoToggleReturnsByType"
import type { ResolvedClothingItem } from "./autoToggleReturnsByType"

// Helper to build a minimal ResolvedClothingItem
function makeItem(
  itemId: number,
  typeId: number,
  typeName: string,
  locationId?: number,
): ResolvedClothingItem {
  return {
    clothingItem: {
      id: itemId,
      typeId,
      size: "M",
      locationId,
      metaData: {
        createdAt: "",
        createdBy: "",
        lastModifiedAt: "",
        lastModifiedBy: "",
      },
      idAsReference: { id: itemId },
    },
    clothingType: {
      id: typeId,
      name: typeName,
      metaData: {
        createdAt: "",
        createdBy: "",
        lastModifiedAt: "",
        lastModifiedBy: "",
      },
      idAsReference: { id: typeId },
    },
  }
}

describe("autoToggleReturnsByType", () => {
  it("returns empty set when locker is empty", () => {
    const takeItems = [makeItem(1, 10, "Jacke")]
    const lockerItems: ResolvedClothingItem[] = []

    const result = autoToggleReturnsByType(takeItems, lockerItems)

    expect(result.size).toBe(0)
  })

  it("returns empty set when no type matches", () => {
    const takeItems = [makeItem(1, 10, "Jacke")]
    const lockerItems = [makeItem(2, 20, "Hose"), makeItem(3, 30, "Helm")]

    const result = autoToggleReturnsByType(takeItems, lockerItems)

    expect(result.size).toBe(0)
  })

  it("toggles locker item whose type matches a taken item", () => {
    const takeItems = [makeItem(1, 10, "Jacke")]
    const lockerItems = [makeItem(2, 10, "Jacke"), makeItem(3, 20, "Hose")]

    const result = autoToggleReturnsByType(takeItems, lockerItems)

    expect(result).toContain(2)
    expect(result).not.toContain(3)
  })

  it("toggles multiple locker items when multiple match the taken type", () => {
    const takeItems = [makeItem(1, 10, "Jacke")]
    const lockerItems = [
      makeItem(2, 10, "Jacke"),
      makeItem(3, 10, "Jacke"),
      makeItem(4, 20, "Hose"),
    ]

    const result = autoToggleReturnsByType(takeItems, lockerItems)

    expect(result).toContain(2)
    expect(result).toContain(3)
    expect(result).not.toContain(4)
  })

  it("toggles based on type regardless of size", () => {
    // Item 1 is size M Jacke being taken; item 2 is size XL Jacke in locker
    const takeItems = [makeItem(1, 10, "Jacke")]
    const lockerItems = [makeItem(2, 10, "Jacke")] // different size, same type

    const result = autoToggleReturnsByType(takeItems, lockerItems)

    expect(result).toContain(2)
  })

  it("handles multiple taken types correctly", () => {
    const takeItems = [makeItem(1, 10, "Jacke"), makeItem(2, 20, "Hose")]
    const lockerItems = [
      makeItem(3, 10, "Jacke"),
      makeItem(4, 20, "Hose"),
      makeItem(5, 30, "Helm"),
    ]

    const result = autoToggleReturnsByType(takeItems, lockerItems)

    expect(result).toContain(3)
    expect(result).toContain(4)
    expect(result).not.toContain(5)
  })
})
