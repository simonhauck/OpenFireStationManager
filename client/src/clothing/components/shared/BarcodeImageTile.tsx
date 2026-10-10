import { ClickableCard } from "@astryxdesign/core/ClickableCard"
import { IconButton } from "@astryxdesign/core/IconButton"
import { X } from "lucide-react"

import RenderIf from "#/components/base/RenderIf"

type BarcodeImageTileProps = {
  imageUrl: string
  alt: string
  onOpen: () => void
  onRemove?: () => void
  /** Rendered tile width; defaults to the inline size used on management pages. */
  width?: number | string
}

/**
 * A barcode guide image shown large enough that the barcode location is
 * recognizable at a glance. Clicking opens the fullscreen lightbox.
 */
export default function BarcodeImageTile({
  imageUrl,
  alt,
  onOpen,
  onRemove,
  width = 192,
}: BarcodeImageTileProps) {
  return (
    <ClickableCard
      label={`${alt} vergrößern`}
      onClick={onOpen}
      padding={0}
      width={width}
      variant="transparent"
    >
      <div className="relative">
        <img
          src={imageUrl}
          alt={alt}
          className="aspect-square w-full rounded-lg border object-cover"
        />
        <RenderIf when={onRemove !== undefined}>
          <div className="absolute top-1 right-1">
            <IconButton
              label={`${alt} entfernen`}
              tooltip="Entfernen"
              icon={<X className="size-4" />}
              variant="secondary"
              size="sm"
              onClick={() => onRemove?.()}
            />
          </div>
        </RenderIf>
      </div>
    </ClickableCard>
  )
}
