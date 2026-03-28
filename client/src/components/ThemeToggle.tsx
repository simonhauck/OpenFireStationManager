import { Moon, Sun } from "lucide-react"
import { useEffect, useState } from "react"

type ThemeMode = "light" | "dark"

function getInitialMode(): ThemeMode {
  if (typeof window === "undefined") {
    return "light"
  }

  const stored = window.localStorage.getItem("theme")
  if (stored === "light" || stored === "dark") {
    return stored
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light"
}

function applyThemeMode(mode: ThemeMode) {
  document.documentElement.classList.remove("light", "dark")
  document.documentElement.classList.add(mode)
  document.documentElement.setAttribute("data-theme", mode)
  document.documentElement.style.colorScheme = mode
}

export default function ThemeToggle() {
  const [mode, setMode] = useState<ThemeMode>("light")

  useEffect(() => {
    const initialMode = getInitialMode()
    setMode(initialMode)
    applyThemeMode(initialMode)
  }, [])

  function toggleMode() {
    const nextMode: ThemeMode = mode === "light" ? "dark" : "light"
    setMode(nextMode)
    applyThemeMode(nextMode)
    window.localStorage.setItem("theme", nextMode)
  }

  const label =
    mode === "dark"
      ? "Dunkles Design aktiv. Klicken für helles Design."
      : "Helles Design aktiv. Klicken für dunkles Design."

  return (
    <button
      type="button"
      onClick={toggleMode}
      aria-label={label}
      title={label}
      className="rounded-full border border-(--chip-line) bg-(--chip-bg) p-2 text-(--sea-ink) shadow-[0_8px_22px_rgba(30,90,72,0.08)] transition hover:-translate-y-0.5"
    >
      <span className="sr-only">{label}</span>
      {mode === "dark" ? (
        <Sun className="size-4" aria-hidden="true" />
      ) : (
        <Moon className="size-4" aria-hidden="true" />
      )}
    </button>
  )
}
