import { useReducer } from "react"
import type { ResolvedClothingItem } from "#/clothing/model/clothingItems.ts"

export type InventoryReconciliationStep = 1 | 2 | 3 | 4

export interface InventoryReconciliationWizardState {
  step: InventoryReconciliationStep
  locationId: number | null
  scannedItems: ResolvedClothingItem[]
}

type Action =
  | { type: "SELECT_LOCATION"; locationId: number }
  | { type: "ADD_ITEM"; item: ResolvedClothingItem }
  | { type: "REMOVE_ITEM"; itemId: number }
  | { type: "ADVANCE_TO_DIFF" }
  | { type: "SUBMIT_OK" }
  | { type: "GO_BACK" }
  | { type: "GO_TO_STEP"; step: InventoryReconciliationStep }
  | { type: "RESET" }

function reducer(
  state: InventoryReconciliationWizardState,
  action: Action,
): InventoryReconciliationWizardState {
  switch (action.type) {
    case "SELECT_LOCATION":
      return { ...state, step: 2, locationId: action.locationId }

    case "ADD_ITEM": {
      const alreadyIn = state.scannedItems.some(
        (i) => i.clothingItem.id === action.item.clothingItem.id,
      )
      if (alreadyIn) return state
      return {
        ...state,
        scannedItems: [...state.scannedItems, action.item],
      }
    }

    case "REMOVE_ITEM":
      return {
        ...state,
        scannedItems: state.scannedItems.filter(
          (i) => i.clothingItem.id !== action.itemId,
        ),
      }

    case "ADVANCE_TO_DIFF":
      return { ...state, step: 3 }

    case "SUBMIT_OK":
      return { ...state, step: 4 }

    case "GO_BACK": {
      if (state.step <= 1) return state
      const prevStep = (state.step - 1) as InventoryReconciliationStep
      return { ...state, step: prevStep }
    }

    case "GO_TO_STEP": {
      if (action.step >= state.step) return state
      return { ...state, step: action.step }
    }

    case "RESET":
      return initialState
  }
}

const initialState: InventoryReconciliationWizardState = {
  step: 1,
  locationId: null,
  scannedItems: [],
}

export interface UseInventoryReconciliationWizardReturn {
  state: InventoryReconciliationWizardState
  selectLocation: (locationId: number) => void
  addItem: (item: ResolvedClothingItem) => void
  removeItem: (itemId: number) => void
  advanceToDiff: () => void
  submitOk: () => void
  goBack: () => void
  goToStep: (step: InventoryReconciliationStep) => void
  reset: () => void
}

export function useInventoryReconciliationWizard(): UseInventoryReconciliationWizardReturn {
  const [state, dispatch] = useReducer(reducer, initialState)

  return {
    state,
    selectLocation: (locationId: number) =>
      dispatch({ type: "SELECT_LOCATION", locationId }),
    addItem: (item: ResolvedClothingItem) =>
      dispatch({ type: "ADD_ITEM", item }),
    removeItem: (itemId: number) => dispatch({ type: "REMOVE_ITEM", itemId }),
    advanceToDiff: () => dispatch({ type: "ADVANCE_TO_DIFF" }),
    submitOk: () => dispatch({ type: "SUBMIT_OK" }),
    goBack: () => dispatch({ type: "GO_BACK" }),
    goToStep: (step) => dispatch({ type: "GO_TO_STEP", step }),
    reset: () => dispatch({ type: "RESET" }),
  }
}
