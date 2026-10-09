import { useLightbox } from "@astryxdesign/core/Lightbox"
import { Text } from "@astryxdesign/core/Text"
import { Thumbnail } from "@astryxdesign/core/Thumbnail"
import { useQuery } from "@tanstack/react-query"

import {
  barcodeImagesQuery,
  clothingTypeImageUrl,
} from "#/clothing/service/clothingTypeImagesQueries"
import RenderIf from "#/components/base/RenderIf"

/**
 * Always-visible "where do I find the barcode?" gallery for the scanner steps:
 * every barcode image of every clothing type, grouped by type. Hidden when no
 * type has images.
 */
export default function BarcodeImagesGallery() {
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
        <div
          data-testid="barcode-images-gallery"
          className="space-y-3 rounded-lg border p-3"
        >
          <Text as="p" type="label">
            Wo finde ich den Barcode?
          </Text>
          <div className="space-y-3">
            {types?.map((type, typeIndex) => (
              <div key={type.typeId} className="space-y-2">
                <Text as="p" type="supporting">
                  {type.typeName}
                </Text>
                <div className="flex flex-wrap gap-2">
                  {type.images.map((image, imageIndex) => (
                    <Thumbnail
                      key={image.id}
                      src={clothingTypeImageUrl(type.typeId, image.id)}
                      alt={`Barcode-Bild ${type.typeName}`}
                      label={`Barcode-Bild ${type.typeName}`}
                      onClick={() =>
                        lightbox.open(
                          (groupStartIndices[typeIndex] ?? 0) + imageIndex,
                        )
                      }
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        {lightbox.element}
      </>
    </RenderIf>
  )
}
