import { FileInput } from "@astryxdesign/core/FileInput"

import {
  ACCEPTED_IMAGE_TYPES,
  MAX_IMAGE_SIZE_BYTES,
} from "#/clothing/service/clothingTypeImagesQueries"

type PendingClothingTypeImagesProps = {
  files: File[]
  onChange: (files: File[]) => void
}

/**
 * Collects barcode guide images on the create form. The files stay local until
 * the type itself is saved; the create page uploads them afterwards.
 */
export default function PendingClothingTypeImages({
  files,
  onChange,
}: PendingClothingTypeImagesProps) {
  return (
    <div data-testid="clothing-type-images-pending">
      <FileInput
        label="Barcode-Bilder"
        description="JPEG, PNG oder WebP, max. 5 MB pro Bild. Die Bilder werden nach dem Speichern hochgeladen."
        value={files}
        onChange={(value) => {
          if (value === null) {
            onChange([])
            return
          }
          onChange(Array.isArray(value) ? value : [value])
        }}
        accept={ACCEPTED_IMAGE_TYPES}
        isMultiple
        maxSize={MAX_IMAGE_SIZE_BYTES}
      />
    </div>
  )
}
