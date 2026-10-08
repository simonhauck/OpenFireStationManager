import { IconButton } from "@astryxdesign/core/IconButton"
import { Moon, Sun } from "lucide-react"
import { useThemeMode } from "#/theme/AppThemeProvider"

export default function ThemeToggle() {
  const { mode, toggleMode } = useThemeMode()

  const label =
    mode === "dark"
      ? "Dunkles Design aktiv. Klicken für helles Design."
      : "Helles Design aktiv. Klicken für dunkles Design."

  return (
    <IconButton
      label={label}
      tooltip={label}
      variant="ghost"
      icon={
        mode === "dark" ? (
          <Sun className="size-4" aria-hidden="true" />
        ) : (
          <Moon className="size-4" aria-hidden="true" />
        )
      }
      onClick={toggleMode}
    />
  )
}
