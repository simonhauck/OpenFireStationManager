import type { ReactNode } from "react"
import type { ResolvedClothingItem } from "#/clothing/model/clothingItems.ts"
import RenderIf from "#/components/base/RenderIf"

interface ClothingItemRowProps {
  item: ResolvedClothingItem
  leading?: ReactNode
  trailing?: ReactNode
  /** Render the row as a <label> element (e.g. for checkbox rows). */
  asLabel?: boolean
  labelFor?: string
}

export default function ClothingItemRow({
  item,
  leading,
  trailing,
  asLabel = false,
  labelFor,
}: ClothingItemRowProps) {
  const inner = (
    <>
      <RenderIf when={leading !== undefined}>
        <div className="shrink-0">{leading}</div>
      </RenderIf>

      <div className="min-w-0 flex-1">
        <p className="text-base">
          {item.clothingType.name} – {item.clothingItem.size}
        </p>
        <RenderIf when={!!item.clothingItem.barcode}>
          <p className="text-muted-foreground text-xs">
            {item.clothingItem.barcode}
          </p>
        </RenderIf>
      </div>

      <RenderIf when={trailing !== undefined}>
        <div className="shrink-0">{trailing}</div>
      </RenderIf>
    </>
  )

  const className = "flex min-h-12 items-center gap-3 rounded-lg border p-3"

  if (asLabel) {
    return (
      <label
        htmlFor={labelFor}
        className={`${className} cursor-pointer hover:bg-muted/50`}
      >
        {inner}
      </label>
    )
  }

  return <div className={className}>{inner}</div>
}
