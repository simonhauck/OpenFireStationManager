import { Link } from "@astryxdesign/core/Link"
import { useQuery } from "@tanstack/react-query"
import type { ReactNode } from "react"

import { meQuery } from "#/api/auth.queries"
import { hasRequiredRole } from "#/api/auth.utils"
import type { UserRole } from "#/users/model/user.ts"

interface EntityNameLinkProps {
  href: string
  allowedRoles: UserRole[]
  enabled?: boolean
  children: ReactNode
}

/**
 * Shared text link for first-class entity references (members, Standorte,
 * clothing items). Chips are reserved for metadata, so entity references stay
 * plain text that is recognisable as navigation through the design system's
 * link styling.
 *
 * The link is only rendered when the current user holds one of the target
 * page's roles. Otherwise the children render as plain text, so a reference
 * never leads to a page the user cannot open. The roles are hardcoded per
 * entity for now; see issue #390 for the planned central access map.
 */
export default function EntityNameLink({
  href,
  allowedRoles,
  enabled = true,
  children,
}: EntityNameLinkProps) {
  const { data } = useQuery(meQuery())
  const userRoles = data?.user?.roles ?? []
  const canAccess = hasRequiredRole(userRoles, allowedRoles)

  if (!enabled || !canAccess) {
    return <>{children}</>
  }

  return <Link href={href}>{children}</Link>
}
