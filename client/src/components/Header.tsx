import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import { Menu, X } from "lucide-react"

import { meQuery } from "#/api/auth.queries"
import AuthButton from "#/components/AuthButton"
import RenderIf from "#/components/base/RenderIf"
import RoleGuard from "#/components/base/RoleGuard.tsx"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "#/components/ui/dropdown-menu"
import ThemeToggle from "./ThemeToggle"

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

        {/* Desktop nav links — hidden on mobile */}
        <div className="hidden items-center gap-4 text-sm font-semibold sm:flex">
          <Link
            to="/about"
            className="nav-link"
            activeProps={{ className: "nav-link is-active" }}
          >
            Über uns
          </Link>
          <RoleGuard allowedRoles={["KLEIDERWART"]} hideChildComponent={true}>
            <Link
              to="/clothing-management"
              className="nav-link"
              activeProps={{ className: "nav-link is-active" }}
            >
              Klamotten Management
            </Link>
          </RoleGuard>

          <RoleGuard allowedRoles={["ADMIN"]} hideChildComponent={true}>
            <Link
              to="/user-management"
              className="nav-link"
              activeProps={{ className: "nav-link is-active" }}
            >
              Nutzermanagement
            </Link>
          </RoleGuard>
        </div>

        {/* Right: auth + theme + mobile menu trigger */}
        <div className="ml-auto flex items-center gap-2">
          <AuthButton />
          <ThemeToggle />
          <div className="sm:hidden">
            <MobileMenu />
          </div>
        </div>
      </nav>
    </header>
  )
}

function MobileMenu() {
  const [open, setOpen] = useState(false)

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Navigationsmenü öffnen"
          className="rounded-full border border-(--chip-line) bg-(--chip-bg) p-2 text-(--sea-ink) shadow-[0_8px_22px_rgba(30,90,72,0.08)] transition hover:-translate-y-0.5"
        >
          <RenderIf when={open}>
            <X className="size-4" aria-hidden="true" />
          </RenderIf>
          <RenderIf when={!open}>
            <Menu className="size-4" aria-hidden="true" />
          </RenderIf>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link to="/about" className="nav-link" onClick={() => setOpen(false)}>
            Über uns
          </Link>
        </DropdownMenuItem>
        <RoleGuard allowedRoles={["KLEIDERWART"]} hideChildComponent={true}>
          <DropdownMenuItem asChild>
            <Link
              to="/clothing-management"
              className="nav-link"
              onClick={() => setOpen(false)}
            >
              Klamotten Management
            </Link>
          </DropdownMenuItem>
        </RoleGuard>
        <RoleGuard allowedRoles={["ADMIN"]} hideChildComponent={true}>
          <DropdownMenuItem asChild>
            <Link
              to="/user-management"
              className="nav-link"
              onClick={() => setOpen(false)}
            >
              Nutzermanagement
            </Link>
          </DropdownMenuItem>
        </RoleGuard>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
