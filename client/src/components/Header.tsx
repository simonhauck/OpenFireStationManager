import { useQuery } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import { Menu, X } from "lucide-react"
import type { ReactNode } from "react"
import { useState } from "react"

import { meQuery } from "#/api/auth.queries"
import { hasRequiredRole } from "#/api/auth.utils"
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

type MenuItem = {
  label: string
  href: string
  allowedRoles?: ("KLEIDERWART" | "ADMIN" | "USER")[]
}

const MENU_ITEMS: MenuItem[] = [
  {
    label: "Pool Klamotten",
    href: "/pool-clothing",
    allowedRoles: ["USER"],
  },
  {
    label: "Klamotten Management",
    href: "/clothing-management",
    allowedRoles: ["KLEIDERWART"],
  },
  {
    label: "Mitglieder",
    href: "/members",
    allowedRoles: ["KLEIDERWART"],
  },
  {
    label: "Nutzer Management",
    href: "/user-management",
    allowedRoles: ["ADMIN"],
  },
  {
    label: "Admin Einstellungen",
    href: "/admin/settings",
    allowedRoles: ["ADMIN"],
  },
]

export default function Header() {
  const { data } = useQuery(meQuery())

  const userRoles = data?.user?.roles ?? []
  const visibleItems = MENU_ITEMS.filter(
    (item) =>
      !item.allowedRoles || hasRequiredRole(userRoles, item.allowedRoles),
  )

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
        <DesktopNav items={visibleItems} />

        {/* Right: auth + theme + mobile menu trigger */}
        <div className="ml-auto flex items-center gap-2">
          <AuthButton />
          <ThemeToggle />
          <RenderIf when={visibleItems.length > 0}>
            <div className="sm:hidden">
              <MobileMenu items={visibleItems} />
            </div>
          </RenderIf>
        </div>
      </nav>
    </header>
  )
}

function MobileMenu({ items }: { items: MenuItem[] }) {
  const [open, setOpen] = useState(false)

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={
            open ? "Navigationsmenü schließen" : "Navigationsmenü öffnen"
          }
          aria-expanded={open}
          className="rounded-full border border-(--chip-line) bg-(--chip-bg) p-2 text-(--sea-ink) shadow-[0_8px_22px_rgba(30,90,72,0.08)] transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
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
        {items.map((item) => (
          <MenuItemRenderer
            key={item.href}
            item={item}
            variant="mobile"
            onNavigate={() => setOpen(false)}
          />
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function DesktopNav({ items }: { items: MenuItem[] }) {
  return (
    <div className="hidden items-center gap-4 text-sm font-semibold sm:flex">
      {items.map((item) => (
        <MenuItemRenderer key={item.href} item={item} />
      ))}
    </div>
  )
}

type MenuItemRendererProps = {
  item: MenuItem
  onNavigate?: () => void
  variant?: "desktop" | "mobile"
}

function MenuItemRenderer({
  item,
  onNavigate,
  variant = "desktop",
}: MenuItemRendererProps): ReactNode {
  const content = (
    <Link
      to={item.href}
      className="nav-link"
      activeProps={{ className: "nav-link is-active" }}
      onClick={onNavigate}
    >
      {item.label}
    </Link>
  )

  const wrappedContent =
    variant === "mobile" ? (
      <DropdownMenuItem asChild>{content}</DropdownMenuItem>
    ) : (
      content
    )

  if (!item.allowedRoles) {
    return wrappedContent
  }

  return (
    <RoleGuard
      key={item.href}
      allowedRoles={item.allowedRoles}
      hideChildComponent={true}
    >
      {wrappedContent}
    </RoleGuard>
  )
}
