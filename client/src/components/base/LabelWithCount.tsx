import { Text } from "@astryxdesign/core/Text"
import type { ReactNode } from "react"

import { cn } from "#/lib/utils"

type LabelCountFormat = "colon" | "braces"

interface LabelWithCountProps {
  label: ReactNode
  count: ReactNode
  format?: LabelCountFormat
  className?: string
  labelClassName?: string
  countClassName?: string
  delimiterClassName?: string
}

export default function LabelWithCount({
  label,
  count,
  format = "colon",
  className,
  labelClassName,
  countClassName,
  delimiterClassName,
}: LabelWithCountProps) {
  return (
    <span className={cn("inline-flex items-center", className)}>
      <Text as="span" type="inherit" className={labelClassName}>
        {label}
      </Text>

      <Text
        as="span"
        type="inherit"
        className={cn("whitespace-pre", delimiterClassName)}
      >
        {format === "braces" ? " (" : ": "}
      </Text>

      <Text
        as="span"
        type="inherit"
        weight="bold"
        className={cn("text-success", countClassName)}
      >
        {count}
      </Text>

      <Text
        as="span"
        type="inherit"
        className={cn("whitespace-pre", delimiterClassName)}
      >
        {format === "braces" ? ")" : null}
      </Text>
    </span>
  )
}
