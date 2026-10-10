import { useReducer } from "react"
import type { ResolvedClothingItem } from "#/clothing/model/clothingItems.ts"

export type CheckoutStep = 1 | 2 | 3 | 4 | 5 | 6

export interface CheckoutWizardState {
  step: CheckoutStep
  targetLocationId: number | null
  takeItems: ResolvedClothingItem[]
  /** Effective return selection: type-based suggestions adjusted by overrides. */
  returnItemIds: Set<number>
  /**
   * Explicit user choices for the return step, keyed by item id (`true` forces
   * an item in, `false` keeps a suggested item out). Suggestions can therefore
   * be re-derived at any time without discarding manual edits.
   */
  returnOverrides: Map<number, boolean>
  /** WAESCHE location ID chosen for dirty returns (null = no returns or not yet chosen). */
  returnLocationId: number | null
}

type Action =
  | { type: "SELECT_TARGET"; locationId: number }
  | { type: "ADD_ITEM"; item: ResolvedClothingItem }
  | { type: "REMOVE_ITEM"; itemId: number }
  | { type: "ADVANCE_TO_RETURNS" }
  | { type: "RECONCILE_SUGGESTED_RETURNS"; suggestedIds: Set<number> }
  | { type: "TOGGLE_RETURN_ITEM"; itemId: number }
  | { type: "CONFIRM_RETURNS" }
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

    case "ADVANCE_TO_RETURNS":
      return { ...state, step: 3 }

    case "ADD_ITEM": {
      const alreadyAdded = state.takeItems.some(
        (i) => i.clothingItem.id === action.item.clothingItem.id,
      )
      if (alreadyAdded) return state // silent no-op on duplicate

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

    case "RECONCILE_SUGGESTED_RETURNS": {
      // Suggestions are a live default: they follow the current takes and
      // locker contents, while explicit overrides always win. Idempotent, so
      // remounting the return step can never clobber manual edits.
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

    case "CONFIRM_RETURNS": {
      // If any returns selected → go to step 4 (pick wash location)
      // Otherwise skip to step 5 (review)
      const nextStep: CheckoutStep = state.returnItemIds.size > 0 ? 4 : 5
      return { ...state, step: nextStep }
    }

    case "SELECT_WASH_LOCATION":
      return {
        ...state,
        step: 5,
        returnLocationId: action.locationId,
      }

    case "SUBMIT_OK":
      return { ...state, step: 6 }

    case "GO_BACK": {
      if (state.step <= 1) return state
      const prevStep = (state.step - 1) as CheckoutStep
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

export interface UseClassicCheckoutWizardReturn {
  state: CheckoutWizardState
  selectTarget: (locationId: number) => void
  addItem: (item: ResolvedClothingItem) => void
  removeItem: (itemId: number) => void
  advanceToReturns: () => void
  reconcileSuggestedReturns: (suggestedIds: Set<number>) => void
  toggleReturnItem: (itemId: number) => void
  confirmReturns: () => void
  selectWashLocation: (locationId: number) => void
  submitOk: () => void
  goBack: () => void
  goToStep: (step: CheckoutStep) => void
  reset: () => void
}

export function useClassicCheckoutWizard(): UseClassicCheckoutWizardReturn {
  const [state, dispatch] = useReducer(reducer, initialState)

  return {
    state,
    selectTarget: (locationId: number) =>
      dispatch({ type: "SELECT_TARGET", locationId }),
    addItem: (item: ResolvedClothingItem) =>
      dispatch({ type: "ADD_ITEM", item }),
    removeItem: (itemId: number) => dispatch({ type: "REMOVE_ITEM", itemId }),
    advanceToReturns: () => dispatch({ type: "ADVANCE_TO_RETURNS" }),
    reconcileSuggestedReturns: (suggestedIds: Set<number>) =>
      dispatch({ type: "RECONCILE_SUGGESTED_RETURNS", suggestedIds }),
    toggleReturnItem: (itemId: number) =>
      dispatch({ type: "TOGGLE_RETURN_ITEM", itemId }),
    confirmReturns: () => dispatch({ type: "CONFIRM_RETURNS" }),
    selectWashLocation: (locationId: number) =>
      dispatch({ type: "SELECT_WASH_LOCATION", locationId }),
    submitOk: () => dispatch({ type: "SUBMIT_OK" }),
    goBack: () => dispatch({ type: "GO_BACK" }),
    goToStep: (step: CheckoutStep) => dispatch({ type: "GO_TO_STEP", step }),
    reset: () => dispatch({ type: "RESET" }),
  }
}
