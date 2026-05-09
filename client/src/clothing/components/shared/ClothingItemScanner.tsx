import { useRef, useState } from "react"
import type { ReactNode } from "react"
import { toast } from "sonner"
import { Trash2Icon } from "lucide-react"

import {
  getItemByBarcode,
  searchClothingItems,
} from "#/clothing/checkout/service/checkoutQueries"
import type { ResolvedClothingItem } from "#/clothing/checkout/service/checkoutQueries"
import {
  TouchButton,
  TouchCombobox,
} from "#/clothing/checkout/components/TouchComponents"
import type { ComboboxOption } from "#/clothing/checkout/components/TouchComponents"
import RenderIf from "#/components/base/RenderIf"
import { Input } from "#/components/ui/input"

export interface ClothingItemScannerProps {
  /** Current list of items already in the batch. Used for duplicate detection. */
  items: ResolvedClothingItem[]
  /** Called when a new (non-duplicate) item is resolved from barcode or search. */
  onItemResolved: (item: ResolvedClothingItem) => void
  /** Called when the user taps the remove button for an item. */
  onRemoveItem: (itemId: number) => void
  /** Optional render prop for workflow-specific badges/annotations per item row. */
  renderItemBadge?: (item: ResolvedClothingItem) => ReactNode
}

export default function ClothingItemScanner({
  items,
  onItemResolved,
  onRemoveItem,
  renderItemBadge,
}: ClothingItemScannerProps) {
  const barcodeInputRef = useRef<HTMLInputElement>(null)
  const [barcodeValue, setBarcodeValue] = useState("")
  const [isScanning, setIsScanning] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<ResolvedClothingItem[]>([])

  async function handleBarcodeSubmit(barcode: string) {
    if (!barcode.trim()) return
    setBarcodeValue("")
    setIsScanning(true)
    try {
      const item = await getItemByBarcode(barcode.trim())
      handleResolved(item)
    } catch {
      toast.error(`Barcode nicht gefunden: ${barcode}`)
    } finally {
      setIsScanning(false)
      barcodeInputRef.current?.focus()
    }
  }

  function handleResolved(item: ResolvedClothingItem) {
    const alreadyInList = items.some(
      (i) => i.clothingItem.id === item.clothingItem.id,
    )
    if (alreadyInList) return // silent duplicate ignore

    onItemResolved(item)
  }

  async function handleSearchSelect(value: string) {
    const found = searchResults.find((r) => String(r.clothingItem.id) === value)
    if (found) handleResolved(found)
  }

  async function handleSearchChange(q: string) {
    setSearchQuery(q)
    if (q.length < 2) {
      setSearchResults([])
      return
    }
    try {
      const results = await searchClothingItems(q)
      setSearchResults(results)
    } catch {
      // silent — search is a backup, not critical
    }
  }

  const searchOptions: ComboboxOption[] = searchResults.map((r) => ({
    value: String(r.clothingItem.id),
    label: `${r.clothingType.name} ${r.clothingItem.size}${r.clothingItem.barcode ? ` (${r.clothingItem.barcode})` : ""}`,
  }))

  return (
    <div className="space-y-4">
      {/* Primary: barcode scanner input */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Barcode scannen</label>
        <Input
          ref={barcodeInputRef}
          value={barcodeValue}
          onChange={(e) => setBarcodeValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              void handleBarcodeSubmit(barcodeValue)
            }
          }}
          placeholder="Barcode eingeben / Scanner verwenden..."
          className="h-12 text-base"
          disabled={isScanning}
          autoFocus
        />
      </div>

      {/* Backup: searchable combobox */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Oder manuell suchen</label>
        <TouchCombobox
          options={searchOptions}
          value={null}
          onSelect={handleSearchSelect}
          onSearchChange={(q) => void handleSearchChange(q)}
          placeholder="Kleidungsstück suchen..."
          searchPlaceholder="Typ, Größe oder Barcode..."
          emptyMessage={
            searchQuery.length < 2
              ? "Mindestens 2 Zeichen eingeben..."
              : "Keine Ergebnisse."
          }
        />
      </div>

      {/* Item list */}
      <RenderIf when={items.length > 0}>
        <div className="space-y-2">
          <p className="text-sm font-medium">
            Ausgewählte Kleidung ({items.length})
          </p>
          <div className="space-y-2">
            {items.map((item) => (
              <div
                key={item.clothingItem.id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <span className="text-base">
                  {item.clothingType.name} – {item.clothingItem.size}
                </span>
                <div className="flex items-center gap-2">
                  <RenderIf when={renderItemBadge !== undefined}>
                    {renderItemBadge?.(item)}
                  </RenderIf>
                  <TouchButton
                    variant="ghost"
                    size="icon"
                    aria-label={`${item.clothingType.name} entfernen`}
                    onClick={() => onRemoveItem(item.clothingItem.id)}
                    className="text-destructive hover:text-destructive size-10 shrink-0"
                  >
                    <Trash2Icon className="size-4" />
                  </TouchButton>
                </div>
              </div>
            ))}
          </div>
        </div>
      </RenderIf>
    </div>
  )
}
