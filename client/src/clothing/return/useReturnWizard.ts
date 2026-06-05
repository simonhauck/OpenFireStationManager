import { useReducer } from "react"
import type { ResolvedClothingItem } from "#/clothing/model/clothingItems.ts"

export type ReturnStep = 1 | 2 | 3 | 4

export interface ReturnWizardState {
  step: ReturnStep
  returnItems: ResolvedClothingItem[]
  returnLocationId: number | undefined
}

type Action =
  | { type: "ADD_ITEM"; item: ResolvedClothingItem }
  | { type: "REMOVE_ITEM"; itemId: number }
  | { type: "SET_ITEMS"; items: ResolvedClothingItem[] }
  | { type: "ADVANCE_TO_TARGET" }
  | { type: "SELECT_TARGET"; locationId: number }
  | { type: "SUBMIT_OK" }
  | { type: "GO_BACK" }
  | { type: "GO_TO_STEP"; step: ReturnStep }
  | { type: "RESET" }

function reducer(state: ReturnWizardState, action: Action): ReturnWizardState {
  switch (action.type) {
    case "ADD_ITEM": {
      if (
        state.returnItems.some(
          (i) => i.clothingItem.id === action.item.clothingItem.id,
        )
      ) {
        return state
      }
      return { ...state, returnItems: [...state.returnItems, action.item] }
    }

    case "REMOVE_ITEM":
      return {
        ...state,
        returnItems: state.returnItems.filter(
          (i) => i.clothingItem.id !== action.itemId,
        ),
      }

    case "SET_ITEMS":
      return { ...state, returnItems: action.items }

    case "ADVANCE_TO_TARGET":
      return { ...state, step: 2 }

    case "SELECT_TARGET":
      return { ...state, step: 3, returnLocationId: action.locationId }

    case "SUBMIT_OK":
      return { ...state, step: 4 }

    case "GO_BACK": {
      if (state.step <= 1) return state
      const prevStep = (state.step - 1) as ReturnStep
      return { ...state, step: prevStep }
    }

    case "GO_TO_STEP":
      return { ...state, step: action.step }

    case "RESET":
      return initialState
  }
}

const initialState: ReturnWizardState = {
  step: 1,
  returnItems: [],
  returnLocationId: undefined,
}

export interface UseReturnWizardReturn {
  state: ReturnWizardState
  addItem: (item: ResolvedClothingItem) => void
  removeItem: (itemId: number) => void
  setItems: (items: ResolvedClothingItem[]) => void
  advanceToTarget: () => void
  selectTarget: (locationId: number) => void
  submitOk: () => void
  goBack: () => void
  goToStep: (step: ReturnStep) => void
  reset: () => void
}

export function useReturnWizard(): UseReturnWizardReturn {
  const [state, dispatch] = useReducer(reducer, initialState)

  return {
    state,
    addItem: (item) => dispatch({ type: "ADD_ITEM", item }),
    removeItem: (itemId) => dispatch({ type: "REMOVE_ITEM", itemId }),
    setItems: (items) => dispatch({ type: "SET_ITEMS", items }),
    advanceToTarget: () => dispatch({ type: "ADVANCE_TO_TARGET" }),
    selectTarget: (locationId) =>
      dispatch({ type: "SELECT_TARGET", locationId }),
    submitOk: () => dispatch({ type: "SUBMIT_OK" }),
    goBack: () => dispatch({ type: "GO_BACK" }),
    goToStep: (step) => dispatch({ type: "GO_TO_STEP", step }),
    reset: () => dispatch({ type: "RESET" }),
  }
}
