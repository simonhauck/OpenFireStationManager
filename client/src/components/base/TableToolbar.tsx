import { HStack } from "@astryxdesign/core/HStack"
import { MultiSelector } from "@astryxdesign/core/MultiSelector"
import { StackItem } from "@astryxdesign/core/Stack"
import { TextInput } from "@astryxdesign/core/TextInput"

export interface TableColumnOption {
  key: string
  label: string
  isAlwaysVisible?: boolean
}

interface TableToolbarProps {
  columnOptions: ReadonlyArray<TableColumnOption>
  activeColumnKeys: ReadonlyArray<string>
  onChangeActiveColumnKeys: (keys: string[]) => void
  searchLabel?: string
  searchPlaceholder?: string
  searchValue?: string
  onSearchChange?: (value: string) => void
}

export default function TableToolbar({
  columnOptions,
  activeColumnKeys,
  onChangeActiveColumnKeys,
  searchLabel,
  searchPlaceholder,
  searchValue,
  onSearchChange,
}: TableToolbarProps) {
  const hasSearch =
    searchValue !== undefined &&
    onSearchChange !== undefined &&
    searchPlaceholder !== undefined

  return (
    <HStack gap={3} vAlign="center" width="100%">
      {hasSearch && (
        <StackItem size="fill">
          <TextInput
            label={searchLabel ?? "Suchen"}
            isLabelHidden
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={onSearchChange}
            hasClear
            size="lg"
            width="100%"
          />
        </StackItem>
      )}
      <MultiSelector
        label="Spalten"
        isLabelHidden
        options={columnOptions.map((option) => ({
          value: option.key,
          label: option.label,
          disabled: option.isAlwaysVisible === true,
        }))}
        value={[...activeColumnKeys]}
        onChange={onChangeActiveColumnKeys}
        formatValue={(items) => `${items.length} Spalten`}
        size="lg"
      />
    </HStack>
  )
}
