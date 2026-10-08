import { HStack } from "@astryxdesign/core/HStack"
import { StackItem, VStack } from "@astryxdesign/core/Stack"
import { Text } from "@astryxdesign/core/Text"
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
  const content = (
    <HStack
      gap={3}
      vAlign="center"
      padding={3}
      width="100%"
      className="min-h-12 rounded-lg border"
    >
      <RenderIf when={leading !== undefined}>
        <StackItem size="static">{leading}</StackItem>
      </RenderIf>

      <StackItem size="fill">
        <VStack gap={0}>
          <Text as="p">
            {item.clothingType.name} – {item.clothingItem.size}
          </Text>
          <RenderIf when={!!item.clothingItem.barcode}>
            <Text as="p" type="supporting">
              {item.clothingItem.barcode}
            </Text>
          </RenderIf>
        </VStack>
      </StackItem>

      <RenderIf when={trailing !== undefined}>
        <StackItem size="static">{trailing}</StackItem>
      </RenderIf>
    </HStack>
  )

  if (asLabel) {
    return (
      <label htmlFor={labelFor} className="block cursor-pointer">
        {content}
      </label>
    )
  }

  return content
}
