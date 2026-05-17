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
      <span className={labelClassName}>{label}</span>

      <span className={cn("whitespace-pre", delimiterClassName)}>
        {format === "braces" ? " (" : ": "}
      </span>

      <span
        className={cn(
          "text-emerald-600 dark:text-emerald-400 font-bold",
          countClassName,
        )}
      >
        {count}
      </span>

      <span className={cn("whitespace-pre", delimiterClassName)}>
        {format === "braces" ? ")" : null}
      </span>
    </span>
  )
}
