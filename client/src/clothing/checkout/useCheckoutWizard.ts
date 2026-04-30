import { useReducer } from "react"
import type { ResolvedClothingItem } from "./autoToggleReturnsByType"

export type CheckoutStep = 1 | 2

export interface CheckoutWizardState {
  step: CheckoutStep
  targetLocationId: number | null
  takeItems: ResolvedClothingItem[]
  /** Item IDs that were added despite not being at a POOL (user confirmed discrepancy). */
  discrepantItemIds: Set<number>
}

type Action =
  | { type: "SELECT_TARGET"; locationId: number }
  | { type: "ADD_ITEM"; item: ResolvedClothingItem; isDiscrepant: boolean }
  | { type: "RESET" }

function reducer(
  state: CheckoutWizardState,
  action: Action,
): CheckoutWizardState {
  switch (action.type) {
    case "SELECT_TARGET":
      return { ...state, step: 2, targetLocationId: action.locationId }

    case "ADD_ITEM": {
      const alreadyAdded = state.takeItems.some(
        (i) => i.clothingItem.id === action.item.clothingItem.id,
      )
      if (alreadyAdded) return state // silent no-op on duplicate

      const newDiscrepantIds = new Set(state.discrepantItemIds)
      if (action.isDiscrepant) {
        newDiscrepantIds.add(action.item.clothingItem.id)
      }

      return {
        ...state,
        takeItems: [...state.takeItems, action.item],
        discrepantItemIds: newDiscrepantIds,
      }
    }

    case "RESET":
      return initialState
  }
}

const initialState: CheckoutWizardState = {
  step: 1,
  targetLocationId: null,
  takeItems: [],
  discrepantItemIds: new Set(),
}

export interface UseCheckoutWizardReturn {
  state: CheckoutWizardState
  selectTarget: (locationId: number) => void
  addItem: (item: ResolvedClothingItem, isDiscrepant?: boolean) => void
  reset: () => void
}

export function useCheckoutWizard(): UseCheckoutWizardReturn {
  const [state, dispatch] = useReducer(reducer, initialState)

  return {
    state,
    selectTarget: (locationId: number) =>
      dispatch({ type: "SELECT_TARGET", locationId }),
    addItem: (item: ResolvedClothingItem, isDiscrepant = false) =>
      dispatch({ type: "ADD_ITEM", item, isDiscrepant }),
    reset: () => dispatch({ type: "RESET" }),
  }
}
