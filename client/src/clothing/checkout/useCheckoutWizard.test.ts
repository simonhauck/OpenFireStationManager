// @vitest-environment jsdom
import { describe, expect, it } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { useCheckoutWizard } from "./useCheckoutWizard"
import type { ResolvedClothingItem } from "./autoToggleReturnsByType"

function makeItem(itemId: number, typeId: number): ResolvedClothingItem {
  return {
    clothingItem: {
      id: itemId,
      typeId,
      size: "M",
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
      name: "TestType",
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

describe("useCheckoutWizard", () => {
  it("starts on step 1 with no target and empty take list", () => {
    const { result } = renderHook(() => useCheckoutWizard())

    expect(result.current.state.step).toBe(1)
    expect(result.current.state.targetLocationId).toBeNull()
    expect(result.current.state.takeItems).toHaveLength(0)
  })

  it("advances from step 1 to step 2 when a target is selected", () => {
    const { result } = renderHook(() => useCheckoutWizard())

    act(() => {
      result.current.selectTarget(42)
    })

    expect(result.current.state.step).toBe(2)
    expect(result.current.state.targetLocationId).toBe(42)
  })

  it("adds an item to the take list", () => {
    const { result } = renderHook(() => useCheckoutWizard())
    const item = makeItem(1, 10)

    act(() => {
      result.current.selectTarget(42)
      result.current.addItem(item)
    })

    expect(result.current.state.takeItems).toHaveLength(1)
    expect(result.current.state.takeItems[0].clothingItem.id).toBe(1)
  })

  it("silently ignores adding a duplicate item", () => {
    const { result } = renderHook(() => useCheckoutWizard())
    const item = makeItem(1, 10)

    act(() => {
      result.current.selectTarget(42)
      result.current.addItem(item)
      result.current.addItem(item) // duplicate
    })

    expect(result.current.state.takeItems).toHaveLength(1)
  })

  it("tracks discrepant items when added with isDiscrepant=true", () => {
    const { result } = renderHook(() => useCheckoutWizard())
    const item = makeItem(5, 10)

    act(() => {
      result.current.selectTarget(42)
      result.current.addItem(item, true)
    })

    expect(result.current.state.discrepantItemIds).toContain(5)
    expect(result.current.state.takeItems).toHaveLength(1)
  })

  it("does not mark item as discrepant when isDiscrepant=false", () => {
    const { result } = renderHook(() => useCheckoutWizard())
    const item = makeItem(5, 10)

    act(() => {
      result.current.selectTarget(42)
      result.current.addItem(item, false)
    })

    expect(result.current.state.discrepantItemIds.size).toBe(0)
  })

  it("resets to initial state", () => {
    const { result } = renderHook(() => useCheckoutWizard())

    act(() => {
      result.current.selectTarget(42)
      result.current.addItem(makeItem(1, 10))
      result.current.reset()
    })

    expect(result.current.state.step).toBe(1)
    expect(result.current.state.targetLocationId).toBeNull()
    expect(result.current.state.takeItems).toHaveLength(0)
  })
})
