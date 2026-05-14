import { X } from "lucide-react"

import RenderIf from "#/components/base/RenderIf"
import { Button } from "#/components/ui/button"
import { Label } from "#/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "#/components/ui/select"

type ClearableSelectProps<T> = {
  label: string
  noItemSelectedLabel: string
  canClear: boolean
  options: T[]
  selectedValue: T | undefined
  onValueChange: (value: T | undefined) => void
  toDisplayString: (value: T) => string
  toKey?: (value: T) => string
  id?: string
  clearAriaLabel?: string
}

export default function ClearableSelect<T>({
  label,
  noItemSelectedLabel,
  canClear,
  options,
  selectedValue,
  onValueChange,
  toDisplayString,
  toKey = (value) => toDisplayString(value),
  id = "clearable-select",
  clearAriaLabel = "Auswahl zurücksetzen",
}: ClearableSelectProps<T>) {
  const selectedKey =
    selectedValue !== undefined ? toKey(selectedValue) : undefined

  function handleValueChange(key: string) {
    const found = options.find((o) => toKey(o) === key)
    onValueChange(found)
  }

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex items-center gap-1">
        <div className="flex-1">
          <Select value={selectedKey ?? ""} onValueChange={handleValueChange}>
            <SelectTrigger id={id}>
              <SelectValue placeholder={noItemSelectedLabel} />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => {
                const key = toKey(option)
                return (
                  <SelectItem key={key} value={key}>
                    {toDisplayString(option)}
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
        </div>
        <RenderIf when={canClear && selectedValue !== undefined}>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={clearAriaLabel}
            onClick={() => onValueChange(undefined)}
          >
            <X className="size-4" />
          </Button>
        </RenderIf>
      </div>
    </div>
  )
}
