import type { ReactNode } from "react"
import { X } from "lucide-react"

import RenderIf from "#/components/base/RenderIf"
import { Button } from "#/components/ui/button"

type ClearableSelectProps = {
  children: ReactNode
  hasValue: boolean
  onClear: () => void
  clearAriaLabel?: string
}

export default function ClearableSelect({
  children,
  hasValue,
  onClear,
  clearAriaLabel = "Auswahl zurücksetzen",
}: ClearableSelectProps) {
  return (
    <div className="flex items-center gap-1">
      <div className="flex-1">{children}</div>
      <RenderIf when={hasValue}>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={clearAriaLabel}
          onClick={onClear}
        >
          <X className="size-4" />
        </Button>
      </RenderIf>
    </div>
  )
}
