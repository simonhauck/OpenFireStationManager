import { Button } from "@astryxdesign/core/Button"
import { IconButton } from "@astryxdesign/core/IconButton"
import { Text } from "@astryxdesign/core/Text"
import { useToast } from "@astryxdesign/core/Toast"
import type { SearchableItem, SearchSource } from "@astryxdesign/core/Typeahead"
import { Typeahead } from "@astryxdesign/core/Typeahead"
import { Trash2Icon } from "lucide-react"
import type { ReactNode } from "react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import {
  getItemByBarcode,
  searchClothingItems,
} from "#/clothing/checkout/service/checkoutQueries"
import BarcodeImagesGallery from "#/clothing/components/shared/BarcodeImagesGallery"
import ClothingItemRow from "#/clothing/components/shared/ClothingItemRow"
import type { ResolvedClothingItem } from "#/clothing/model/clothingItems.ts"
import RenderIf from "#/components/base/RenderIf"

type InputMode = "scanner" | "manual"

export interface ClothingItemScannerProps {
  /** Current list of items already in the batch. Used for duplicate detection. */
  items: ResolvedClothingItem[]
  /** Called when a new (non-duplicate) item is resolved from barcode or search. */
  onItemResolved: (item: ResolvedClothingItem) => void
  /** Called when the user taps the remove button for an item. */
  onRemoveItem: (itemId: number) => void
  /** Optional render prop for workflow-specific badges/annotations per item row. */
  renderItemBadge?: (item: ResolvedClothingItem) => ReactNode
  /**
   * Whether to render the built-in list of resolved items. Set to false when
   * the parent renders the batch itself (e.g. the combined swap screen).
   */
  showItemList?: boolean
}

/** Barcode scanners typically send all chars within this window (ms). */
const SCANNER_TIMEOUT_MS = 50

interface ScannerSearchItem extends SearchableItem {
  auxiliaryData: ResolvedClothingItem
}

export default function ClothingItemScanner({
  items,
  onItemResolved,
  onRemoveItem,
  renderItemBadge,
  showItemList = true,
}: ClothingItemScannerProps) {
  const [inputMode, setInputMode] = useState<InputMode>("scanner")
  const [isScanning, setIsScanning] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const showToast = useToast()

  // Global barcode capture
  const bufferRef = useRef("")

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Keep a stable ref to items so the keydown handler always sees the latest list
  const itemsRef = useRef(items)
  useEffect(() => {
    itemsRef.current = items
  }, [items])
  const isScanningRef = useRef(false)

  const handleResolved = useCallback(
    (item: ResolvedClothingItem) => {
      const alreadyInList = itemsRef.current.some(
        (i) => i.clothingItem.id === item.clothingItem.id,
      )
      if (alreadyInList) return // silent duplicate ignore

      onItemResolved(item)
    },
    [onItemResolved],
  )

  const processBarcode = useCallback(
    async (barcode: string) => {
      if (isScanningRef.current) return
      isScanningRef.current = true
      setIsScanning(true)
      try {
        const item = await getItemByBarcode(barcode)
        handleResolved(item)
      } catch {
        showToast({
          body: `Unbekannter Barcode: ${barcode}`,
          type: "error",
          isAutoHide: true,
        })
      } finally {
        isScanningRef.current = false
        setIsScanning(false)
      }
    },
    [handleResolved, showToast],
  )

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
  }, [processBarcode])

  const searchSource: SearchSource<ScannerSearchItem> = useMemo(
    () => ({
      search: async (query: string) => {
        try {
          const results = await searchClothingItems(query)
          return results.map((result) => ({
            id: String(result.clothingItem.id),
            label: `${result.clothingType.name} ${result.clothingItem.size}${result.clothingItem.barcode ? ` (${result.clothingItem.barcode})` : ""}`,
            auxiliaryData: result,
          }))
        } catch {
          // silent — search is a backup, not critical
          return []
        }
      },
      bootstrap: () => [],
    }),
    [],
  )

  return (
    <div className="space-y-4">
      {/* Scanner status indicator */}
      <RenderIf when={inputMode === "scanner"}>
        <div className="flex items-center gap-2 rounded-lg border p-3 text-sm">
          <span
            className={`size-2 shrink-0 rounded-full ${isScanning ? "animate-pulse bg-warning" : "bg-success"}`}
          />
          <Text type="supporting" as="span">
            {isScanning
              ? "Barcode wird verarbeitet…"
              : "Scanner bereit – einfach scannen"}
          </Text>
        </div>
      </RenderIf>

      {/* Manual search */}
      <RenderIf when={inputMode === "manual"}>
        <Typeahead<ScannerSearchItem>
          label="Kleidungsstück"
          isLabelHidden
          placeholder="Kleidungsstück suchen..."
          searchSource={searchSource}
          value={null}
          onChange={(item) => {
            if (item) handleResolved(item.auxiliaryData)
          }}
          onChangeQuery={setSearchQuery}
          minQueryLength={2}
          size="lg"
          width="100%"
          hasClear={false}
          emptySearchText={
            searchQuery.length < 2
              ? "Mindestens 2 Zeichen eingeben..."
              : "Keine Ergebnisse."
          }
        />
      </RenderIf>

      {/* Mode switch + barcode guide */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button
          variant="ghost"
          size="lg"
          label={
            inputMode === "scanner"
              ? "Stattdessen manuell suchen"
              : "Stattdessen Scanner verwenden"
          }
          onClick={() =>
            setInputMode(inputMode === "scanner" ? "manual" : "scanner")
          }
        />
        <BarcodeImagesGallery />
      </div>

      {/* Item list */}
      <RenderIf when={showItemList && items.length > 0}>
        <div className="space-y-2">
          <Text as="p" type="label">
            Ausgewählte Kleidung ({items.length})
          </Text>
          <div className="space-y-2">
            {items.map((item) => (
              <ClothingItemRow
                key={item.clothingItem.id}
                item={item}
                trailing={
                  <div className="flex items-center gap-2">
                    <RenderIf when={renderItemBadge !== undefined}>
                      {renderItemBadge?.(item)}
                    </RenderIf>
                    <IconButton
                      variant="ghost"
                      size="lg"
                      label={`${item.clothingType.name} entfernen`}
                      tooltip="Entfernen"
                      icon={<Trash2Icon className="size-4" />}
                      onClick={() => onRemoveItem(item.clothingItem.id)}
                    />
                  </div>
                }
              />
            ))}
          </div>
        </div>
      </RenderIf>
    </div>
  )
}
