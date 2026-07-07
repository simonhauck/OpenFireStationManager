import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react"
import type { ReactNode } from "react"

interface KioskContextValue {
  kioskEnabled: boolean
  setKioskEnabled: (enabled: boolean) => void
  isKeyboardOpen: boolean
}

const KIOSK_STORAGE_KEY = "kiosk"
const KIOSK_TOGGLE_EVENT = "kiosk-toggle"

export const KioskContext = createContext<KioskContextValue>({
  kioskEnabled: false,
  setKioskEnabled: () => {},
  isKeyboardOpen: false,
})

export function useKiosk() {
  return useContext(KioskContext)
}

interface KioskProviderProps {
  children: ReactNode
}

export default function KioskProvider({ children }: KioskProviderProps) {
  const [kioskEnabled, setKioskEnabledState] = useState(() =>
    isLocalStorageAvailable()
      ? localStorage.getItem(KIOSK_STORAGE_KEY) === "true"
      : false,
  )
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false)

  const setKioskEnabled = useCallback((enabled: boolean) => {
    if (isLocalStorageAvailable()) {
      localStorage.setItem(KIOSK_STORAGE_KEY, String(enabled))
    }
    window.dispatchEvent(
      new CustomEvent(KIOSK_TOGGLE_EVENT, { detail: { enabled } }),
    )
  }, [])

  useEffect(() => {
    const handleToggle = (e: Event) => {
      const detail = (e as CustomEvent<{ enabled: boolean }>).detail
      setKioskEnabledState(detail.enabled)
      if (!detail.enabled) {
        setIsKeyboardOpen(false)
      }
    }
    window.addEventListener(KIOSK_TOGGLE_EVENT, handleToggle)
    return () => window.removeEventListener(KIOSK_TOGGLE_EVENT, handleToggle)
  }, [])

  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === KIOSK_STORAGE_KEY) {
        setKioskEnabledState(e.newValue === "true")
      }
    }
    window.addEventListener("storage", handleStorage)
    return () => window.removeEventListener("storage", handleStorage)
  }, [])

  useEffect(() => {
    if (!kioskEnabled) {
      setIsKeyboardOpen(false)
      return
    }

    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement | null
      if (!target) return
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        if (!target.closest("[data-kiosk-keyboard]")) {
          setIsKeyboardOpen(true)
        }
      }
    }

    const handleFocusOut = () => {
      requestAnimationFrame(() => {
        const active = document.activeElement as HTMLElement | null
        if (
          !active ||
          (active.tagName !== "INPUT" &&
            active.tagName !== "TEXTAREA" &&
            !active.isContentEditable)
        ) {
          setIsKeyboardOpen(false)
        }
      })
    }

    document.addEventListener("focusin", handleFocusIn)
    document.addEventListener("focusout", handleFocusOut)
    return () => {
      document.removeEventListener("focusin", handleFocusIn)
      document.removeEventListener("focusout", handleFocusOut)
    }
  }, [kioskEnabled])

  return (
    <KioskContext.Provider
      value={{ kioskEnabled, setKioskEnabled, isKeyboardOpen }}
    >
      {children}
    </KioskContext.Provider>
  )
}

function isLocalStorageAvailable(): boolean {
  try {
    const key = "__kiosk_test__"
    localStorage.setItem(key, "1")
    localStorage.removeItem(key)
    return true
  } catch {
    return false
  }
}
