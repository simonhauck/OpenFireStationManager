import { Button } from "@astryxdesign/core/Button"
import { Dialog, DialogHeader } from "@astryxdesign/core/Dialog"
import { Layout, LayoutContent } from "@astryxdesign/core/Layout"
import { useLightbox } from "@astryxdesign/core/Lightbox"
import { Text } from "@astryxdesign/core/Text"
import { useQuery } from "@tanstack/react-query"
import { useState } from "react"

import BarcodeImageTile from "#/clothing/components/shared/BarcodeImageTile"
import {
  barcodeImagesQuery,
  clothingTypeImageUrl,
} from "#/clothing/service/clothingTypeImagesQueries"
import RenderIf from "#/components/base/RenderIf"

const GALLERY_TILE_WIDTH = 280
const GALLERY_DIALOG_WIDTH = 960

/**
 * "Where do I find the barcode?" help for the scanner steps: a button in the
 * scanner's mode-switch row opens a dialog with every barcode image of every
 * clothing type, grouped by type, at a readable size. Hidden when no type has
 * images. Tapping an image opens it full-screen.
 */
export default function BarcodeImagesGallery() {
  const [isOpen, setIsOpen] = useState(false)
  const { data: types } = useQuery(barcodeImagesQuery())

  const media = (types ?? []).flatMap((type) =>
    type.images.map((image) => ({
      src: clothingTypeImageUrl(type.typeId, image.id),
      alt: `Barcode-Bild ${type.typeName}`,
    })),
  )
  const lightbox = useLightbox({ media })

  let nextIndex = 0
  const groupStartIndices = (types ?? []).map((type) => {
    const start = nextIndex
    nextIndex += type.images.length
    return start
  })

  return (
    <RenderIf when={(types?.length ?? 0) > 0}>
      <>
        <Button
          label="Wo finde ich den Barcode?"
          variant="secondary"
          size="lg"
          onClick={() => setIsOpen(true)}
        />
        <Dialog
          isOpen={isOpen}
          onOpenChange={setIsOpen}
          width={GALLERY_DIALOG_WIDTH}
        >
          <Layout
            header={
              <DialogHeader
                title="Wo finde ich den Barcode?"
                onOpenChange={setIsOpen}
              />
            }
            content={
              <LayoutContent>
                <div data-testid="barcode-images-gallery" className="space-y-4">
                  {types?.map((type, typeIndex) => (
                    <div key={type.typeId} className="space-y-2">
                      <Text as="p" type="supporting">
                        {type.typeName}
                      </Text>
                      <div className="flex flex-wrap gap-3">
                        {type.images.map((image, imageIndex) => (
                          <BarcodeImageTile
                            key={image.id}
                            imageUrl={clothingTypeImageUrl(
                              type.typeId,
                              image.id,
                            )}
                            alt={`Barcode-Bild ${type.typeName}`}
                            width={GALLERY_TILE_WIDTH}
                            onOpen={() =>
                              lightbox.open(
                                (groupStartIndices[typeIndex] ?? 0) +
                                  imageIndex,
                              )
                            }
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </LayoutContent>
            }
          />
        </Dialog>
        {lightbox.element}
      </>
    </RenderIf>
  )
}
