import { useEffect, useRef, useState } from "react"
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

/** Barcode scanners typically send all chars within this window (ms). */
const SCANNER_TIMEOUT_MS = 50

export default function ClothingItemScanner({
  items,
  onItemResolved,
  onRemoveItem,
  renderItemBadge,
}: ClothingItemScannerProps) {
  const [isScanning, setIsScanning] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<ResolvedClothingItem[]>([])

  // Global barcode capture
  const bufferRef = useRef("")

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Keep a stable ref to items so the keydown handler always sees the latest list
  const itemsRef = useRef(items)
  useEffect(() => {
    itemsRef.current = items
  }, [items])
  const isScanningRef = useRef(false)

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Ignore when the user is typing inside an actual input / textarea / combobox
      const target = e.target as HTMLElement
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return
      }

      if (e.key === "Enter") {
        const barcode = bufferRef.current.trim()
        bufferRef.current = ""
        if (timerRef.current) {
          clearTimeout(timerRef.current)
          timerRef.current = null
        }
        if (barcode) {
          void processBarcode(barcode)
        }
        return
      }

      // Accumulate printable characters
      if (e.key.length === 1) {
        bufferRef.current += e.key

        // Auto-flush after a short idle period (handles scanners that don't send Enter)
        if (timerRef.current) clearTimeout(timerRef.current)
        timerRef.current = setTimeout(() => {
          const barcode = bufferRef.current.trim()
          bufferRef.current = ""
          timerRef.current = null
          if (barcode) void processBarcode(barcode)
        }, SCANNER_TIMEOUT_MS)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  async function processBarcode(barcode: string) {
    if (isScanningRef.current) return
    isScanningRef.current = true
    setIsScanning(true)
    try {
      const item = await getItemByBarcode(barcode)
      handleResolved(item)
    } catch {
      toast.error(`Unbekannter Barcode: ${barcode}`)
    } finally {
      isScanningRef.current = false
      setIsScanning(false)
    }
  }

  function handleResolved(item: ResolvedClothingItem) {
    const alreadyInList = itemsRef.current.some(
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
      {/* Scanner status indicator */}
      <div className="flex items-center gap-2 rounded-lg border p-3 text-sm">
        <span
          className={`size-2 shrink-0 rounded-full ${isScanning ? "animate-pulse bg-yellow-500" : "bg-green-500"}`}
        />
        <span className="text-muted-foreground">
          {isScanning
            ? "Barcode wird verarbeitet…"
            : "Scanner bereit – einfach scannen"}
        </span>
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
