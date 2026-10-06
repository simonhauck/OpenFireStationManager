import { Check, ChevronsUpDown, X } from "lucide-react"
import { useState } from "react"

import RenderIf from "#/components/base/RenderIf"
import { Button } from "#/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "#/components/ui/command"
import { Label } from "#/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "#/components/ui/popover"
import { cn } from "#/lib/utils"

type ClearableComboboxProps<T> = {
  label: string
  noItemSelectedLabel: string
  canClear: boolean
  options: T[]
  selectedValue: T | undefined
  onValueChange: (value: T | undefined) => void
  toDisplayString: (value: T) => string
  toKey?: (value: T) => string
  id?: string
  searchPlaceholder?: string
  emptyMessage?: string
  clearAriaLabel?: string
}

export default function ClearableCombobox<T>({
  label,
  noItemSelectedLabel,
  canClear,
  options,
  selectedValue,
  onValueChange,
  toDisplayString,
  toKey = (value) => toDisplayString(value),
  id = "clearable-combobox",
  searchPlaceholder = "Suchen...",
  emptyMessage = "Keine Ergebnisse gefunden.",
  clearAriaLabel = "Auswahl zurücksetzen",
}: ClearableComboboxProps<T>) {
  const [open, setOpen] = useState(false)

  const selectedKey =
    selectedValue !== undefined ? toKey(selectedValue) : undefined
  const selectedLabel =
    selectedValue !== undefined ? toDisplayString(selectedValue) : undefined

  function handleSelect(key: string) {
    const found = options.find((option) => toKey(option) === key)
    onValueChange(found)
    setOpen(false)
  }

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex items-center gap-1">
        <div className="flex-1">
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                id={id}
                type="button"
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className="w-full justify-between font-normal"
              >
                {selectedLabel ?? noItemSelectedLabel}
                <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-(--radix-popover-trigger-width) p-0">
              <Command>
                <CommandInput placeholder={searchPlaceholder} />
                <CommandList>
                  <CommandEmpty>{emptyMessage}</CommandEmpty>
                  <CommandGroup>
                    {options.map((option) => {
                      const key = toKey(option)
                      return (
                        <CommandItem
                          key={key}
                          value={key}
                          keywords={[toDisplayString(option)]}
                          onSelect={() => handleSelect(key)}
                        >
                          {toDisplayString(option)}
                          <Check
                            className={cn(
                              "ml-auto size-4",
                              selectedKey === key ? "opacity-100" : "opacity-0",
                            )}
                          />
                        </CommandItem>
                      )
                    })}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
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
