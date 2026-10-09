import { AlertDialog } from "@astryxdesign/core/AlertDialog"
import { Button } from "@astryxdesign/core/Button"
import { FileInput } from "@astryxdesign/core/FileInput"
import { useLightbox } from "@astryxdesign/core/Lightbox"
import { useToast } from "@astryxdesign/core/Toast"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Upload } from "lucide-react"
import { useState } from "react"

import BarcodeImageTile from "#/clothing/components/shared/BarcodeImageTile"
import type { ClothingTypeImageMetadata } from "#/clothing/model/clothingType"
import {
  ACCEPTED_IMAGE_TYPES,
  clothingTypeImagesQuery,
  clothingTypeImageUrl,
  deleteClothingTypeImageMutation,
  MAX_IMAGE_SIZE_BYTES,
  uploadClothingTypeImageMutation,
} from "#/clothing/service/clothingTypeImagesQueries"
import ErrorState from "#/components/base/ErrorState"
import LoadingIndicator from "#/components/base/LoadingIndicator"
import RenderIf from "#/components/base/RenderIf"

type ClothingTypeImagesSectionProps = {
  typeId: number
}

export default function ClothingTypeImagesSection({
  typeId,
}: ClothingTypeImagesSectionProps) {
  const queryClient = useQueryClient()
  const showToast = useToast()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [imageToDelete, setImageToDelete] =
    useState<ClothingTypeImageMetadata | null>(null)

  const {
    data: images,
    isLoading,
    isError,
  } = useQuery(clothingTypeImagesQuery(typeId))
  const { mutate: uploadImage, isPending: isUploading } = useMutation(
    uploadClothingTypeImageMutation(queryClient),
  )
  const { mutate: deleteImage } = useMutation(
    deleteClothingTypeImageMutation(queryClient),
  )

  const lightbox = useLightbox({
    media: imageMedia(typeId, images ?? []),
  })

  function handleUpload() {
    if (!selectedFile) {
      return
    }

    uploadImage(
      { typeId, file: selectedFile },
      {
        onSuccess: () => {
          showToast({ body: "Bild wurde hochgeladen.", type: "info" })
          setSelectedFile(null)
        },
        onError: (error) => {
          showToast({ body: error.message, type: "error", isAutoHide: true })
        },
      },
    )
  }

  function handleDelete() {
    if (!imageToDelete) {
      return
    }

    deleteImage(
      { typeId, imageId: imageToDelete.id },
      {
        onSuccess: () => {
          setImageToDelete(null)
          showToast({ body: "Bild wurde gelöscht.", type: "info" })
        },
        onError: (error) => {
          showToast({ body: error.message, type: "error", isAutoHide: true })
        },
      },
    )
  }

  return (
    <>
      <RenderIf when={isLoading}>
        <LoadingIndicator label="Bilder werden geladen..." />
      </RenderIf>

      <RenderIf when={isError}>
        <ErrorState message="Bilder konnten nicht geladen werden." />
      </RenderIf>

      <RenderIf when={!isLoading && !isError}>
        <>
          <div className="space-y-3" data-testid="clothing-type-images">
            <RenderIf when={(images?.length ?? 0) > 0}>
              <div className="flex flex-wrap gap-3">
                {images?.map((image, index) => (
                  <BarcodeImageTile
                    key={image.id}
                    imageUrl={clothingTypeImageUrl(typeId, image.id)}
                    alt={`Barcode-Bild ${index + 1}`}
                    onOpen={() => lightbox.open(index)}
                    onRemove={() => setImageToDelete(image)}
                  />
                ))}
              </div>
            </RenderIf>

            <div className="flex flex-wrap items-end gap-3">
              <FileInput
                label="Bild hinzufügen"
                description="JPEG, PNG oder WebP, max. 5 MB."
                value={selectedFile}
                onChange={(value) =>
                  setSelectedFile(
                    Array.isArray(value) ? (value[0] ?? null) : value,
                  )
                }
                accept={ACCEPTED_IMAGE_TYPES}
                maxSize={MAX_IMAGE_SIZE_BYTES}
              />
              <Button
                label="Bild hochladen"
                icon={<Upload className="size-4" />}
                variant="secondary"
                isDisabled={!selectedFile || isUploading}
                isLoading={isUploading}
                onClick={handleUpload}
              />
            </div>
          </div>
          {lightbox.element}
        </>
      </RenderIf>

      <AlertDialog
        isOpen={imageToDelete !== null}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setImageToDelete(null)
          }
        }}
        title="Bild löschen"
        description="Soll dieses Barcode-Bild wirklich gelöscht werden? Es verschwindet dann von allen Scanner-Seiten."
        actionLabel="Löschen"
        onAction={handleDelete}
        cancelLabel="Abbrechen"
        actionVariant="destructive"
      />
    </>
  )
}

function imageMedia(typeId: number, images: ClothingTypeImageMetadata[]) {
  return images.map((image, index) => ({
    src: clothingTypeImageUrl(typeId, image.id),
    alt: `Barcode-Bild ${index + 1}`,
  }))
}
