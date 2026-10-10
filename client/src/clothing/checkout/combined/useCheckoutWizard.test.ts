// @vitest-environment jsdom

import { act, renderHook } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import type { ResolvedClothingItem } from "#/clothing/model/clothingItems.ts"
import { useCheckoutWizard } from "./useCheckoutWizard"

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

  it("does not add an item that is already selected for return", () => {
    const { result } = renderHook(() => useCheckoutWizard())
    const item = makeItem(1, 10)

    act(() => {
      result.current.selectTarget(42)
      result.current.moveItemToReturn(item)
      result.current.addItem(item)
    })

    expect(result.current.state.takeItems).toHaveLength(0)
    expect(result.current.state.returnItemIds).toEqual(new Set([1]))
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

  // ── Move between Ausgabe and Rückgabe ────────────────────────────────────

  it("moves a take to the return selection and keeps it there on reconcile", () => {
    const { result } = renderHook(() => useCheckoutWizard())
    const item = makeItem(1, 10)

    act(() => {
      result.current.selectTarget(42)
      result.current.addItem(item)
      result.current.moveItemToReturn(item)
    })

    expect(result.current.state.takeItems).toHaveLength(0)
    expect(result.current.state.returnItemIds).toEqual(new Set([1]))

    // The forced return is an override; live re-reconciliation must keep it.
    act(() => {
      result.current.reconcileSuggestedReturns(new Set())
    })

    expect(result.current.state.returnItemIds).toEqual(new Set([1]))
  })

  it("moves a forced return back to the take list and drops the override", () => {
    const { result } = renderHook(() => useCheckoutWizard())
    const item = makeItem(1, 10)

    act(() => {
      result.current.selectTarget(42)
      result.current.addItem(item)
      result.current.moveItemToReturn(item)
      result.current.moveItemToTake(item)
    })

    expect(result.current.state.returnItemIds).toEqual(new Set())
    expect(result.current.state.takeItems).toHaveLength(1)

    // No stale override: reconciling empty suggestions keeps the item out.
    act(() => {
      result.current.reconcileSuggestedReturns(new Set())
    })

    expect(result.current.state.returnItemIds).toEqual(new Set())
  })

  // ── Suggestions and overrides ─────────────────────────────────────────────

  it("reconciles suggested returns into the selection", () => {
    const { result } = renderHook(() => useCheckoutWizard())

    act(() => {
      result.current.reconcileSuggestedReturns(new Set([10, 20, 30]))
    })

    expect(result.current.state.returnItemIds).toEqual(new Set([10, 20, 30]))
  })

  it("keeps a manually unchecked suggestion out when suggestions are reconciled (#323)", () => {
    const { result } = renderHook(() => useCheckoutWizard())

    act(() => {
      result.current.reconcileSuggestedReturns(new Set([10, 20]))
      result.current.toggleReturnItem(20) // user unchecks 20
      result.current.reconcileSuggestedReturns(new Set([10, 20]))
    })

    expect(result.current.state.returnItemIds).toEqual(new Set([10]))
  })

  it("keeps a manually checked non-suggested item in when suggestions are reconciled", () => {
    const { result } = renderHook(() => useCheckoutWizard())

    act(() => {
      result.current.reconcileSuggestedReturns(new Set([10]))
      result.current.toggleReturnItem(30) // user checks 30 additionally
      result.current.reconcileSuggestedReturns(new Set([10]))
    })

    expect(result.current.state.returnItemIds).toEqual(new Set([10, 30]))
  })

  it("drops suggestions that no longer apply but keeps manual choices", () => {
    const { result } = renderHook(() => useCheckoutWizard())

    act(() => {
      result.current.reconcileSuggestedReturns(new Set([10, 20]))
      result.current.toggleReturnItem(30) // user checks 30 additionally
      result.current.reconcileSuggestedReturns(new Set([10]))
    })

    expect(result.current.state.returnItemIds).toEqual(new Set([10, 30]))
  })

  it("clears selections and overrides when a new target is selected", () => {
    const { result } = renderHook(() => useCheckoutWizard())

    act(() => {
      result.current.selectTarget(1)
      result.current.reconcileSuggestedReturns(new Set([10]))
      result.current.toggleReturnItem(20)
      result.current.selectTarget(2)
    })

    expect(result.current.state.returnItemIds).toEqual(new Set())

    act(() => {
      result.current.reconcileSuggestedReturns(new Set([30]))
    })

    expect(result.current.state.returnItemIds).toEqual(new Set([30]))
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

  // ── Step 2 → 3 → 4 → 5 ────────────────────────────────────────────────────

  it("advances to the wash step when returns are selected", () => {
    const { result } = renderHook(() => useCheckoutWizard())

    act(() => {
      result.current.selectTarget(1)
      result.current.toggleReturnItem(5)
      result.current.advanceFromSwap()
    })

    expect(result.current.state.step).toBe(3)
  })

  it("skips the wash step and goes to review when no returns are selected", () => {
    const { result } = renderHook(() => useCheckoutWizard())

    act(() => {
      result.current.selectTarget(1)
      result.current.advanceFromSwap()
    })

    expect(result.current.state.step).toBe(4)
  })

  it("advances to review and stores the wash location", () => {
    const { result } = renderHook(() => useCheckoutWizard())

    act(() => {
      result.current.selectTarget(1)
      result.current.toggleReturnItem(5)
      result.current.advanceFromSwap()
      result.current.selectWashLocation(99)
    })

    expect(result.current.state.step).toBe(4)
    expect(result.current.state.returnLocationId).toBe(99)
  })

  it("advances to step 5 (success) when submitOk is called", () => {
    const { result } = renderHook(() => useCheckoutWizard())

    act(() => {
      result.current.selectTarget(1)
      result.current.advanceFromSwap()
      result.current.submitOk()
    })

    expect(result.current.state.step).toBe(5)
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

  it("goBack from the wash step returns to the swap step", () => {
    const { result } = renderHook(() => useCheckoutWizard())

    act(() => {
      result.current.selectTarget(1)
      result.current.toggleReturnItem(5)
      result.current.advanceFromSwap() // → step 3
      result.current.goBack()
    })

    expect(result.current.state.step).toBe(2)
  })

  it("goBack from review returns to the wash step when returns exist", () => {
    const { result } = renderHook(() => useCheckoutWizard())

    act(() => {
      result.current.selectTarget(1)
      result.current.toggleReturnItem(5)
      result.current.advanceFromSwap() // → step 3
      result.current.selectWashLocation(99) // → step 4
      result.current.goBack()
    })

    expect(result.current.state.step).toBe(3)
  })

  it("goBack from review skips the wash step when no returns exist", () => {
    const { result } = renderHook(() => useCheckoutWizard())

    act(() => {
      result.current.selectTarget(1)
      result.current.advanceFromSwap() // → step 4 (no returns)
      result.current.goBack()
    })

    expect(result.current.state.step).toBe(2)
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
