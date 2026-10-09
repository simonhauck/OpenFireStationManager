import { useReducer } from "react"
import type { ResolvedClothingItem } from "#/clothing/model/clothingItems.ts"

export type CheckoutStep = 1 | 2 | 3 | 4 | 5 | 6

export interface CheckoutWizardState {
  step: CheckoutStep
  targetLocationId: number | null
  takeItems: ResolvedClothingItem[]
  /** Item IDs from the locker that the user wants to return. */
  returnItemIds: Set<number>
  /** WAESCHE location ID chosen for dirty returns (null = no returns or not yet chosen). */
  returnLocationId: number | null
  /**
   * True once the type-based auto-selection has been applied for the current
   * target. Kept in wizard state so it survives step remounts and never
   * overwrites manual (de)selections.
   */
  hasAppliedAutoReturnToggles: boolean
}

type Action =
  | { type: "SELECT_TARGET"; locationId: number }
  | { type: "ADD_ITEM"; item: ResolvedClothingItem }
  | { type: "REMOVE_ITEM"; itemId: number }
  | { type: "ADVANCE_TO_RETURNS" }
  | { type: "APPLY_AUTO_RETURN_TOGGLES"; ids: Set<number> }
  | { type: "TOGGLE_RETURN_ITEM"; itemId: number }
  | { type: "CONFIRM_RETURNS" }
  | { type: "SELECT_WASH_LOCATION"; locationId: number }
  | { type: "SUBMIT_OK" }
  | { type: "GO_BACK" }
  | { type: "GO_TO_STEP"; step: CheckoutStep }
  | { type: "RESET" }

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
        hasAppliedAutoReturnToggles: false,
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

    case "APPLY_AUTO_RETURN_TOGGLES":
      // Apply once per target; later mounts of the return step must not
      // overwrite selections the user made manually.
      if (state.hasAppliedAutoReturnToggles) return state
      return {
        ...state,
        returnItemIds: new Set(action.ids),
        hasAppliedAutoReturnToggles: true,
      }

    case "TOGGLE_RETURN_ITEM": {
      const next = new Set(state.returnItemIds)
      if (next.has(action.itemId)) {
        next.delete(action.itemId)
      } else {
        next.add(action.itemId)
      }
      return { ...state, returnItemIds: next }
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
  returnLocationId: null,
  hasAppliedAutoReturnToggles: false,
}

export interface UseCheckoutWizardReturn {
  state: CheckoutWizardState
  selectTarget: (locationId: number) => void
  addItem: (item: ResolvedClothingItem) => void
  removeItem: (itemId: number) => void
  advanceToReturns: () => void
  applyAutoReturnToggles: (ids: Set<number>) => void
  toggleReturnItem: (itemId: number) => void
  confirmReturns: () => void
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
    advanceToReturns: () => dispatch({ type: "ADVANCE_TO_RETURNS" }),
    applyAutoReturnToggles: (ids: Set<number>) =>
      dispatch({ type: "APPLY_AUTO_RETURN_TOGGLES", ids }),
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
