import { Link, useLocation, useRouter } from "@tanstack/react-router"
import type { FileRoutesByPath } from "@tanstack/react-router"
import { ChevronRight, Home } from "lucide-react"

// ─── Derive StaticSegment from the generated route tree ───────────────────────

type AllPaths = keyof FileRoutesByPath

type SplitPath<T extends string> = T extends `${infer Head}/${infer Tail}`
  ? Head | SplitPath<Tail>
  : T

type AllRawSegments = SplitPath<AllPaths>

type StaticSegment = Exclude<AllRawSegments, "" | `$${string}`>

// ─── Label map ────────────────────────────────────────────────────────────────

const SEGMENT_LABELS: Record<StaticSegment, string> = {
  admin: "Administration",
  batch: "Stapelverarbeitung",
  "change-password": "Passwort ändern",
  checkout: "Klamotten Ausgabe",
  "clothing-management": "Klamotten Management",
  edit: "Bearbeiten",
  items: "Kleidungsstücke",
  locations: "Standorte",
  login: "Anmelden",
  new: "Neu",
  "pool-clothing": "Pool Klamotten",
  relocation: "Umlagerung",
  settings: "Einstellungen",
  types: "Typen",
  "user-management": "Nutzer Management",
  dashboard: "Dashboard",
  impressum: "Impressum",
}

function isStaticSegment(segment: string): segment is StaticSegment {
  return segment in SEGMENT_LABELS
}

function segmentLabel(segment: string): string {
  if (isStaticSegment(segment)) return SEGMENT_LABELS[segment]
  return segment
}

// ─── Route pattern matching ───────────────────────────────────────────────────
// Converts a route pattern like '/user-management/$userId/edit' into a regex
// that matches concrete paths like '/user-management/42/edit'.

function patternToRegex(pattern: string): RegExp {
  const normalized = pattern.replace(/\/+$/, "")
  const escaped = normalized.replace(/\//g, "\\/").replace(/\$[^/]+/g, "[^/]+")
  return new RegExp(`^${escaped}\\/?$`)
}

function hrefMatchesAnyRoute(href: string, patterns: string[]): boolean {
  return patterns.some((pattern) => patternToRegex(pattern).test(href))
}

// ─── Crumb builder ────────────────────────────────────────────────────────────

interface Crumb {
  label: string
  href: string
  isLinked: boolean
}

function buildCrumbs(pathname: string, routePatterns: string[]): Crumb[] {
  const segments = pathname.split("/").filter(Boolean)
  const crumbs: Crumb[] = []

  let href = ""
  for (const segment of segments) {
    href += `/${segment}`
    crumbs.push({
      label: segmentLabel(segment),
      href,
      isLinked: hrefMatchesAnyRoute(href, routePatterns),
    })
  }

  return crumbs
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Breadcrumb() {
  const router = useRouter()
  const { pathname } = useLocation()

  const routePatterns = Object.values(router.routesById)
    .map((route) => route.fullPath)
    .filter((p): p is string => typeof p === "string" && p.length > 0)

  const crumbs = buildCrumbs(pathname, routePatterns)

  if (crumbs.length === 0) return null

  return (
    <nav
      aria-label="Breadcrumb"
      className="border-border bg-background hidden border-b px-4 py-2 sm:block"
    >
      <ol className="flex items-center gap-1 text-sm">
        {/* Home */}
        <li>
          <Link
            to="/"
            className="text-muted-foreground hover:text-foreground flex items-center transition-colors"
            aria-label="Startseite"
          >
            <Home className="size-3.5" />
          </Link>
        </li>

        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1
          return (
            <li key={crumb.href} className="flex items-center gap-1">
              <ChevronRight className="text-muted-foreground size-3.5 shrink-0" />
              {isLast || !crumb.isLinked ? (
                <span
                  className={
                    isLast
                      ? "text-foreground font-medium"
                      : "text-muted-foreground"
                  }
                >
                  {crumb.label}
                </span>
              ) : (
                <Link
                  to={crumb.href}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {crumb.label}
                </Link>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
