import { useReducer } from "react"
import type { ResolvedClothingItem } from "#/clothing/model/clothingItems.ts"

export type CheckoutStep = 1 | 2 | 3 | 4 | 5

export interface CheckoutWizardState {
  step: CheckoutStep
  targetLocationId: number | null
  takeItems: ResolvedClothingItem[]
  /** Effective return selection: type-based suggestions adjusted by overrides. */
  returnItemIds: Set<number>
  /**
   * Explicit user choices, keyed by item id (`true` forces an item in,
   * `false` keeps a suggested item out). Suggestions can therefore be
   * re-derived at any time without discarding manual edits.
   */
  returnOverrides: Map<number, boolean>
  /** WAESCHE location ID chosen for dirty returns (null = no returns or not yet chosen). */
  returnLocationId: number | null
}

type Action =
  | { type: "SELECT_TARGET"; locationId: number }
  | { type: "ADD_ITEM"; item: ResolvedClothingItem }
  | { type: "REMOVE_ITEM"; itemId: number }
  | { type: "MOVE_ITEM_TO_RETURN"; item: ResolvedClothingItem }
  | { type: "MOVE_ITEM_TO_TAKE"; item: ResolvedClothingItem }
  | { type: "RECONCILE_SUGGESTED_RETURNS"; suggestedIds: Set<number> }
  | { type: "TOGGLE_RETURN_ITEM"; itemId: number }
  | { type: "ADVANCE_FROM_SWAP" }
  | { type: "SELECT_WASH_LOCATION"; locationId: number }
  | { type: "SUBMIT_OK" }
  | { type: "GO_BACK" }
  | { type: "GO_TO_STEP"; step: CheckoutStep }
  | { type: "RESET" }

function areSetsEqual(a: Set<number>, b: Set<number>): boolean {
  if (a.size !== b.size) return false
  for (const value of a) {
    if (!b.has(value)) return false
  }
  return true
}

function reducer(
  state: CheckoutWizardState,
  action: Action,
): CheckoutWizardState {
  switch (action.type) {
    case "SELECT_TARGET":
      return {
        ...state,
        step: 2,
        targetLocationId: action.locationId,
        returnItemIds: new Set(),
        returnOverrides: new Map(),
      }

    case "ADD_ITEM": {
      const itemId = action.item.clothingItem.id
      const alreadyAdded = state.takeItems.some(
        (i) => i.clothingItem.id === itemId,
      )
      // An item selected for return must never also be a take — the server
      // rejects an item that appears in both lists.
      if (alreadyAdded || state.returnItemIds.has(itemId)) return state

      return {
        ...state,
        takeItems: [...state.takeItems, action.item],
      }
    }

    case "REMOVE_ITEM":
      return {
        ...state,
        takeItems: state.takeItems.filter(
          (i) => i.clothingItem.id !== action.itemId,
        ),
      }

    case "MOVE_ITEM_TO_RETURN": {
      // Left → right: force the item into the return selection. Used by the
      // "Zurückgeben" action on take rows and when a scanned item already sits
      // at the target location.
      const itemId = action.item.clothingItem.id
      const returnItemIds = new Set(state.returnItemIds)
      returnItemIds.add(itemId)
      const overrides = new Map(state.returnOverrides)
      overrides.set(itemId, true)
      return {
        ...state,
        takeItems: state.takeItems.filter((i) => i.clothingItem.id !== itemId),
        returnItemIds,
        returnOverrides: overrides,
      }
    }

    case "MOVE_ITEM_TO_TAKE": {
      // Right → left: an item that was forced to return (recorded somewhere
      // other than the target locker) goes back to the take list.
      const itemId = action.item.clothingItem.id
      const returnItemIds = new Set(state.returnItemIds)
      returnItemIds.delete(itemId)
      const overrides = new Map(state.returnOverrides)
      overrides.delete(itemId)
      const alreadyTake = state.takeItems.some(
        (i) => i.clothingItem.id === itemId,
      )
      return {
        ...state,
        takeItems: alreadyTake
          ? state.takeItems
          : [...state.takeItems, action.item],
        returnItemIds,
        returnOverrides: overrides,
      }
    }

    case "RECONCILE_SUGGESTED_RETURNS": {
      // Suggestions are a live default: they follow the current takes and
      // locker contents, while explicit overrides always win. Idempotent, so
      // remounting the swap step can never clobber manual edits.
      const next = new Set(action.suggestedIds)
      for (const [itemId, isChecked] of state.returnOverrides) {
        if (isChecked) {
          next.add(itemId)
        } else {
          next.delete(itemId)
        }
      }
      if (areSetsEqual(next, state.returnItemIds)) return state
      return { ...state, returnItemIds: next }
    }

    case "TOGGLE_RETURN_ITEM": {
      const isChecked = state.returnItemIds.has(action.itemId)
      const next = new Set(state.returnItemIds)
      if (isChecked) {
        next.delete(action.itemId)
      } else {
        next.add(action.itemId)
      }
      const overrides = new Map(state.returnOverrides)
      overrides.set(action.itemId, !isChecked)
      return { ...state, returnItemIds: next, returnOverrides: overrides }
    }

    case "ADVANCE_FROM_SWAP": {
      // If any returns are selected → pick a wash location first;
      // otherwise skip straight to the review.
      const nextStep: CheckoutStep = state.returnItemIds.size > 0 ? 3 : 4
      return { ...state, step: nextStep }
    }

    case "SELECT_WASH_LOCATION":
      return {
        ...state,
        step: 4,
        returnLocationId: action.locationId,
      }

    case "SUBMIT_OK":
      return { ...state, step: 5 }

    case "GO_BACK": {
      if (state.step <= 1 || state.step === 5) return state
      // The wash step is skipped when nothing is returned, so going back from
      // the review lands on the swap step instead.
      const prevStep: CheckoutStep =
        state.step === 4 && state.returnItemIds.size === 0
          ? 2
          : ((state.step - 1) as CheckoutStep)
      return { ...state, step: prevStep }
    }

    case "GO_TO_STEP":
      return { ...state, step: action.step }

    case "RESET":
      return initialState
  }
}

const initialState: CheckoutWizardState = {
  step: 1,
  targetLocationId: null,
  takeItems: [],
  returnItemIds: new Set(),
  returnOverrides: new Map(),
  returnLocationId: null,
}

export interface UseCheckoutWizardReturn {
  state: CheckoutWizardState
  selectTarget: (locationId: number) => void
  addItem: (item: ResolvedClothingItem) => void
  removeItem: (itemId: number) => void
  moveItemToReturn: (item: ResolvedClothingItem) => void
  moveItemToTake: (item: ResolvedClothingItem) => void
  reconcileSuggestedReturns: (suggestedIds: Set<number>) => void
  toggleReturnItem: (itemId: number) => void
  advanceFromSwap: () => void
  selectWashLocation: (locationId: number) => void
  submitOk: () => void
  goBack: () => void
  goToStep: (step: CheckoutStep) => void
  reset: () => void
}

export function useCheckoutWizard(): UseCheckoutWizardReturn {
  const [state, dispatch] = useReducer(reducer, initialState)

  return {
    state,
    selectTarget: (locationId: number) =>
      dispatch({ type: "SELECT_TARGET", locationId }),
    addItem: (item: ResolvedClothingItem) =>
      dispatch({ type: "ADD_ITEM", item }),
    removeItem: (itemId: number) => dispatch({ type: "REMOVE_ITEM", itemId }),
    moveItemToReturn: (item: ResolvedClothingItem) =>
      dispatch({ type: "MOVE_ITEM_TO_RETURN", item }),
    moveItemToTake: (item: ResolvedClothingItem) =>
      dispatch({ type: "MOVE_ITEM_TO_TAKE", item }),
    reconcileSuggestedReturns: (suggestedIds: Set<number>) =>
      dispatch({ type: "RECONCILE_SUGGESTED_RETURNS", suggestedIds }),
    toggleReturnItem: (itemId: number) =>
      dispatch({ type: "TOGGLE_RETURN_ITEM", itemId }),
    advanceFromSwap: () => dispatch({ type: "ADVANCE_FROM_SWAP" }),
    selectWashLocation: (locationId: number) =>
      dispatch({ type: "SELECT_WASH_LOCATION", locationId }),
    submitOk: () => dispatch({ type: "SUBMIT_OK" }),
    goBack: () => dispatch({ type: "GO_BACK" }),
    goToStep: (step: CheckoutStep) => dispatch({ type: "GO_TO_STEP", step }),
    reset: () => dispatch({ type: "RESET" }),
  }
}
