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

  // ── Step 3: Return Toggles ────────────────────────────────────────────────

  it("sets return item IDs in bulk (for auto-toggle on entry)", () => {
    const { result } = renderHook(() => useCheckoutWizard())

    act(() => {
      result.current.setReturnItemIds(new Set([10, 20, 30]))
    })

    expect(result.current.state.returnItemIds).toEqual(new Set([10, 20, 30]))
  })

  it("toggles a return item on and off", () => {
    const { result } = renderHook(() => useCheckoutWizard())

    act(() => {
      result.current.toggleReturnItem(7)
    })
    expect(result.current.state.returnItemIds.has(7)).toBe(true)

    act(() => {
      result.current.toggleReturnItem(7)
    })
    expect(result.current.state.returnItemIds.has(7)).toBe(false)
  })

  it("advances to step 4 when confirmReturns is called with returns selected", () => {
    const { result } = renderHook(() => useCheckoutWizard())

    act(() => {
      result.current.selectTarget(1)
      result.current.setReturnItemIds(new Set([5]))
      result.current.confirmReturns()
    })

    expect(result.current.state.step).toBe(4)
  })

  it("skips step 4 and goes to step 5 when confirmReturns is called with no returns", () => {
    const { result } = renderHook(() => useCheckoutWizard())

    act(() => {
      result.current.selectTarget(1)
      result.current.confirmReturns()
    })

    expect(result.current.state.step).toBe(5)
  })

  // ── Step 4: Wash Location ─────────────────────────────────────────────────

  it("advances to step 5 and stores wash location when selectWashLocation is called", () => {
    const { result } = renderHook(() => useCheckoutWizard())

    act(() => {
      result.current.selectTarget(1)
      result.current.setReturnItemIds(new Set([5]))
      result.current.confirmReturns()
      result.current.selectWashLocation(99)
    })

    expect(result.current.state.step).toBe(5)
    expect(result.current.state.returnLocationId).toBe(99)
  })

  // ── Step 5 → 6: Submit OK ─────────────────────────────────────────────────

  it("advances to step 6 (success) when submitOk is called", () => {
    const { result } = renderHook(() => useCheckoutWizard())

    act(() => {
      result.current.selectTarget(1)
      result.current.confirmReturns()
      result.current.submitOk()
    })

    expect(result.current.state.step).toBe(6)
  })

  // ── GO_BACK ───────────────────────────────────────────────────────────────

  it("goBack from step 2 returns to step 1", () => {
    const { result } = renderHook(() => useCheckoutWizard())

    act(() => {
      result.current.selectTarget(1) // → step 2
      result.current.goBack()
    })

    expect(result.current.state.step).toBe(1)
  })

  it("goBack from step 5 returns to step 4", () => {
    const { result } = renderHook(() => useCheckoutWizard())

    act(() => {
      result.current.selectTarget(1)
      result.current.setReturnItemIds(new Set([5]))
      result.current.confirmReturns() // → step 4
      result.current.selectWashLocation(99) // → step 5
      result.current.goBack()
    })

    expect(result.current.state.step).toBe(4)
  })

  it("goBack does nothing when already on step 1", () => {
    const { result } = renderHook(() => useCheckoutWizard())

    act(() => {
      result.current.goBack()
    })

    expect(result.current.state.step).toBe(1)
  })

  it("goToStep navigates to a specific completed step", () => {
    const { result } = renderHook(() => useCheckoutWizard())

    act(() => {
      result.current.selectTarget(1) // → step 2
      result.current.goToStep(1)
    })

    expect(result.current.state.step).toBe(1)
  })

  // ── REMOVE_ITEM ───────────────────────────────────────────────────────────

  it("removes an item from the take list", () => {
    const { result } = renderHook(() => useCheckoutWizard())
    const item = makeItem(1, 10)

    act(() => {
      result.current.selectTarget(42)
      result.current.addItem(item)
      result.current.removeItem(1)
    })

    expect(result.current.state.takeItems).toHaveLength(0)
  })
})
