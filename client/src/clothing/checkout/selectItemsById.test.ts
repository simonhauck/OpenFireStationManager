import { describe, expect, it } from "vitest"
import { selectItemsById } from "#/clothing/checkout/selectItemsById.ts"
import type { ResolvedClothingItem } from "#/clothing/model/clothingItems.ts"

function makeItem(itemId: number): ResolvedClothingItem {
  return {
    clothingItem: {
      id: itemId,
      typeId: 1,
      size: "M",
      metaData: {
        createdAt: "",
        createdBy: "",
        lastModifiedAt: "",
        lastModifiedBy: "",
      },
    },
    clothingType: {
      id: 1,
      name: "Jacke",
      metaData: {
        createdAt: "",
        createdBy: "",
        lastModifiedAt: "",
        lastModifiedBy: "",
      },
    },
  }
}

describe("selectItemsById", () => {
  it("picks items matching the given ids", () => {
    const items = [makeItem(1), makeItem(2), makeItem(3)]

    const result = selectItemsById(items, new Set([3, 1]))

    expect(result.map((item) => item.clothingItem.id)).toEqual([3, 1])
  })

  it("ignores ids without a matching item", () => {
    const items = [makeItem(1)]

    const result = selectItemsById(items, new Set([1, 99]))

    expect(result.map((item) => item.clothingItem.id)).toEqual([1])
  })

  it("returns an empty array when no ids are selected", () => {
    const result = selectItemsById([makeItem(1)], new Set())

    expect(result).toEqual([])
  })
})
