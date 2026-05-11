/**
 * Touch-sized wrapper components for tablet UI.
 * These wrap shadcn primitives to enforce Material 48dp minimum tap-target size
 * without modifying the originals in src/components/ui/*.
 */
import * as React from "react"
import { CheckIcon, ChevronsUpDownIcon } from "lucide-react"

import { cn } from "#/lib/utils"
import { Button } from "#/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "#/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "#/components/ui/popover"

/**
 * A Button with a minimum height of 48px (Material touch target).
 */
export function TouchButton({
  className,
  ...props
}: React.ComponentProps<typeof Button>) {
  return <Button className={cn("min-h-12", className)} {...props} />
}

export interface ComboboxOption {
  value: string
  label: string
}

export interface TouchComboboxProps {
  options: ComboboxOption[]
  value: string | null
  onSelect: (value: string) => void
  onSearchChange?: (query: string) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyMessage?: string
  className?: string
  disabled?: boolean
}

/**
 * A searchable Combobox (Popover + Command) with a minimum 48px trigger height.
 */
export function TouchCombobox({
  options,
  value,
  onSelect,
  onSearchChange,
  placeholder = "Auswählen...",
  searchPlaceholder = "Suchen...",
  emptyMessage = "Keine Ergebnisse gefunden.",
  className,
  disabled,
}: TouchComboboxProps) {
  const [open, setOpen] = React.useState(false)

  const selectedLabel = options.find((o) => o.value === value)?.label

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "min-h-12 w-full justify-between text-base font-normal",
            !value && "text-muted-foreground",
            className,
          )}
        >
          {selectedLabel ?? placeholder}
          <ChevronsUpDownIcon className="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-(--radix-popover-trigger-width) p-0">
        <Command>
          <CommandInput
            placeholder={searchPlaceholder}
            className="h-12 text-base"
            onValueChange={onSearchChange}
          />
          <CommandList>
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.label}
                  onSelect={() => {
                    onSelect(option.value)
                    setOpen(false)
                  }}
                  className="min-h-12 text-base"
                >
                  {option.label}
                  <CheckIcon
                    className={cn(
                      "ml-auto size-4",
                      value === option.value ? "opacity-100" : "opacity-0",
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
