import { Link } from "@astryxdesign/core/Link"
import type { ReactNode } from "react"

interface EntityNameLinkProps {
  href: string
  children: ReactNode
}

/**
 * Shared text link for first-class entity references (members, Standorte).
 * Chips are reserved for metadata, so entity names stay plain text that is
 * recognisable as navigation through the design system's link styling.
 */
export default function EntityNameLink({
  href,
  children,
}: EntityNameLinkProps) {
  return <Link href={href}>{children}</Link>
}
