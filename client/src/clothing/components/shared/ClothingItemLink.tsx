import type { ReactNode } from "react"

import EntityNameLink from "#/components/base/EntityNameLink"

type ClothingItemLinkProps = {
  clothingItemId: number
  enabled?: boolean
  children: ReactNode
}

/**
 * Renders a standalone clothing item reference. There is no read-only item
 * detail page yet, so the link target is the item edit page. Renders plain
 * text when the user cannot access clothing management or when linking is
 * disabled for the current context.
 */
export default function ClothingItemLink({
  clothingItemId,
  enabled = true,
  children,
}: ClothingItemLinkProps) {
  return (
    <EntityNameLink
      href={`/clothing-management/items/${clothingItemId}/edit`}
      allowedRoles={["KLEIDERWART"]}
      enabled={enabled}
    >
      {children}
    </EntityNameLink>
  )
}
