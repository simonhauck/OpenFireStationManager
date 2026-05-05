import { useReducer } from "react"
import type { ResolvedClothingItem } from "#/clothing/checkout/service/checkoutQueries"

export type RelocationStep = 1 | 2 | 3 | 4

export interface RelocationWizardState {
  step: RelocationStep
  targetLocationId: number | null
  items: ResolvedClothingItem[]
  batchId: string | null
}

type Action =
  | { type: "SELECT_TARGET"; locationId: number }
  | { type: "ADD_ITEM"; item: ResolvedClothingItem }
  | { type: "REMOVE_ITEM"; itemId: number }
  | { type: "ADVANCE_TO_REVIEW" }
  | { type: "SUBMIT_OK"; batchId: string }
  | { type: "GO_BACK" }
  | { type: "RESET" }

function reducer(
  state: RelocationWizardState,
  action: Action,
): RelocationWizardState {
  switch (action.type) {
    case "SELECT_TARGET":
      return { ...state, step: 2, targetLocationId: action.locationId }

    case "ADD_ITEM": {
      const alreadyIn = state.items.some(
        (i) => i.clothingItem.id === action.item.clothingItem.id,
      )
      if (alreadyIn) return state
      return { ...state, items: [...state.items, action.item] }
    }

    case "REMOVE_ITEM":
      return {
        ...state,
        items: state.items.filter((i) => i.clothingItem.id !== action.itemId),
      }

    case "ADVANCE_TO_REVIEW":
      return { ...state, step: 3 }

    case "SUBMIT_OK":
      return { ...state, step: 4, batchId: action.batchId }

    case "GO_BACK": {
      if (state.step <= 1) return state
      const prevStep = (state.step - 1) as RelocationStep
      return { ...state, step: prevStep }
    }

    case "RESET":
      return initialState
  }
}

const initialState: RelocationWizardState = {
  step: 1,
  targetLocationId: null,
  items: [],
  batchId: null,
}

export interface UseRelocationWizardReturn {
  state: RelocationWizardState
  selectTarget: (locationId: number) => void
  addItem: (item: ResolvedClothingItem) => void
  removeItem: (itemId: number) => void
  advanceToReview: () => void
  submitOk: (batchId: string) => void
  goBack: () => void
  reset: () => void
}

export function useRelocationWizard(): UseRelocationWizardReturn {
  const [state, dispatch] = useReducer(reducer, initialState)

  return {
    state,
    selectTarget: (locationId: number) =>
      dispatch({ type: "SELECT_TARGET", locationId }),
    addItem: (item: ResolvedClothingItem) =>
      dispatch({ type: "ADD_ITEM", item }),
    removeItem: (itemId: number) => dispatch({ type: "REMOVE_ITEM", itemId }),
    advanceToReview: () => dispatch({ type: "ADVANCE_TO_REVIEW" }),
    submitOk: (batchId: string) => dispatch({ type: "SUBMIT_OK", batchId }),
    goBack: () => dispatch({ type: "GO_BACK" }),
    reset: () => dispatch({ type: "RESET" }),
  }
}
