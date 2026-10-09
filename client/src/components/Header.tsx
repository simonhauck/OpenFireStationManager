import { MobileNavToggle } from "@astryxdesign/core/MobileNav"
import { TopNav, TopNavHeading, TopNavItem } from "@astryxdesign/core/TopNav"
import { useQuery } from "@tanstack/react-query"
import { useRouterState } from "@tanstack/react-router"

import { meQuery } from "#/api/auth.queries"
import { hasRequiredRole } from "#/api/auth.utils"
import AuthButton from "#/components/AuthButton"
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
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })

  const userRoles = data?.user?.roles ?? []
  const visibleItems = MENU_ITEMS.filter(
    (item) =>
      !item.allowedRoles || hasRequiredRole(userRoles, item.allowedRoles),
  )

  return (
    <TopNav
      label="Hauptnavigation"
      heading={
        <>
          <MobileNavToggle />
          <TopNavHeading heading="OpenFireStationManager" headingHref="/" />
        </>
      }
      startContent={visibleItems.map((item) => (
        <TopNavItem
          key={item.href}
          label={item.label}
          href={item.href}
          isSelected={
            pathname === item.href || pathname.startsWith(`${item.href}/`)
          }
        />
      ))}
      endContent={
        <div className="flex items-center gap-2">
          <AuthButton />
          <ThemeToggle />
        </div>
      }
    />
  )
}
