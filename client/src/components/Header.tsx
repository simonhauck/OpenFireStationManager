import { useQuery } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"

import { meQuery } from "#/api/auth.queries"
import AuthButton from "#/components/AuthButton"
import ThemeToggle from "./ThemeToggle"
import RoleGuard from "#/components/base/RoleGuard.tsx"

export default function Header() {
  useQuery(meQuery())

  return (
    <header className="sticky top-0 z-50 border-b border-(--line) bg-(--header-bg) px-4 backdrop-blur-lg">
      <nav className="page-wrap flex items-center gap-6 py-3 sm:py-4">
        {/* Left: brand + nav links */}
        <Link
          to="/"
          className="shrink-0 text-sm font-semibold text-(--sea-ink) no-underline"
        >
          OpenFireStationManager
        </Link>

        <div className="flex items-center gap-4 text-sm font-semibold">
          <Link
            to="/about"
            className="nav-link"
            activeProps={{ className: "nav-link is-active" }}
          >
            Über uns
          </Link>
          <RoleGuard allowedRoles={["KLEIDERWART"]} hideChildComponent={true}>
            <Link
              to="/klamottenmanagement"
              className="nav-link"
              activeProps={{ className: "nav-link is-active" }}
            >
              Klamotten Management
            </Link>
          </RoleGuard>

          <RoleGuard allowedRoles={["ADMIN"]} hideChildComponent={true}>
            <Link
              to="/nutzermanagement"
              className="nav-link"
              activeProps={{ className: "nav-link is-active" }}
            >
              Nutzermanagement
            </Link>
          </RoleGuard>
        </div>

        {/* Right: auth + theme */}
        <div className="ml-auto flex items-center gap-2">
          <AuthButton />
          <ThemeToggle />
        </div>
      </nav>
    </header>
  )
}
