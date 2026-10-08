import { InternationalizationProvider } from "@astryxdesign/core/i18n"
import { LinkProvider } from "@astryxdesign/core/Link"
import deDE from "@astryxdesign/core/locales/de-DE.generated.js"
import { Theme } from "@astryxdesign/core/theme"
import { Link } from "@tanstack/react-router"
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"
import { appTheme } from "./appTheme"

type ThemeMode = "light" | "dark"

interface ThemeModeContextValue {
  mode: ThemeMode
  toggleMode: () => void
}

const ThemeModeContext = createContext<ThemeModeContextValue | null>(null)

export function useThemeMode(): ThemeModeContextValue {
  const context = useContext(ThemeModeContext)
  if (!context) {
    throw new Error("useThemeMode must be used within AppThemeProvider")
  }
  return context
}

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
  const root = document.documentElement
  root.classList.remove("light", "dark")
  root.classList.add(mode)
  root.style.colorScheme = mode
}

interface RouterLinkProps {
  to?: string
  href?: string
  children?: ReactNode
  className?: string
  style?: React.CSSProperties
  target?: string
  rel?: string
  onClick?: (event: React.MouseEvent<HTMLAnchorElement>) => void
  [key: string]: unknown
}

function RouterLink({ to, href, ...rest }: RouterLinkProps) {
  const destination = to ?? href ?? "/"
  return <Link to={destination as never} {...(rest as object)} />
}

interface AppThemeProviderProps {
  children: ReactNode
}

export function AppThemeProvider({ children }: AppThemeProviderProps) {
  const [mode, setMode] = useState<ThemeMode>(getInitialMode)

  useEffect(() => {
    applyThemeMode(mode)
  }, [mode])

  const toggleMode = useCallback(() => {
    setMode((current) => {
      const next: ThemeMode = current === "light" ? "dark" : "light"
      window.localStorage.setItem("theme", next)
      return next
    })
  }, [])

  const value = useMemo(() => ({ mode, toggleMode }), [mode, toggleMode])

  return (
    <ThemeModeContext.Provider value={value}>
      <Theme theme={appTheme} mode={mode}>
        <InternationalizationProvider
          locale="de-DE"
          messages={{ "de-DE": deDE }}
        >
          <LinkProvider component={RouterLink}>{children}</LinkProvider>
        </InternationalizationProvider>
      </Theme>
    </ThemeModeContext.Provider>
  )
}
