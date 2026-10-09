import type { QueryClient } from "@tanstack/react-query"
import { mutationOptions, queryOptions } from "@tanstack/react-query"

import { client, ensureData } from "#/api/client"
import { queryKeys } from "#/api/queryKeys"
import type {
  ClothingTypeBarcodeImages,
  ClothingTypeImageMetadata,
} from "#/clothing/model/clothingType"

export const ACCEPTED_IMAGE_TYPES = "image/jpeg,image/png,image/webp"
export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024

export const clothingTypeImagesQuery = (typeId: number) =>
  queryOptions({
    queryKey: queryKeys.clothingTypeImages(typeId),
    queryFn: async (): Promise<ClothingTypeImageMetadata[]> => {
      const { data, error } = await client.GET(
        "/api/clothing/types/{typeId}/images",
        { params: { path: { typeId } } },
      )
      return ensureData(data, error, "GET /api/clothing/types/{typeId}/images")
    },
  })

export const barcodeImagesQuery = () =>
  queryOptions({
    queryKey: queryKeys.barcodeImages(),
    queryFn: async (): Promise<ClothingTypeBarcodeImages[]> => {
      const { data, error } = await client.GET(
        "/api/clothing/types/barcode-images",
      )
      return ensureData(data, error, "GET /api/clothing/types/barcode-images")
    },
  })

export const clothingTypeImageUrl = (typeId: number, imageId: number) =>
  `/api/clothing/types/${typeId}/images/${imageId}`

export const uploadClothingTypeImageMutation = (queryClient: QueryClient) =>
  mutationOptions({
    mutationKey: [...queryKeys.barcodeImages(), "upload"] as const,
    mutationFn: async (variables: {
      typeId: number
      file: File
    }): Promise<ClothingTypeImageMetadata> => {
      const formData = new FormData()
      formData.append("file", variables.file)

      const { data, error } = await client.POST(
        "/api/clothing/types/{typeId}/images",
        {
          params: { path: { typeId: variables.typeId } },
          body: formData as unknown as { file: string },
        },
      )
      return ensureData(data, error, "POST /api/clothing/types/{typeId}/images")
    },
    onSuccess: async (_, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: queryKeys.clothingTypeImages(variables.typeId),
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.barcodeImages(),
        }),
      ])
    },
  })

export const deleteClothingTypeImageMutation = (queryClient: QueryClient) =>
  mutationOptions({
    mutationKey: [...queryKeys.barcodeImages(), "delete"] as const,
    mutationFn: async (variables: {
      typeId: number
      imageId: number
    }): Promise<void> => {
      await client.DELETE("/api/clothing/types/{typeId}/images/{imageId}", {
        params: {
          path: { typeId: variables.typeId, imageId: variables.imageId },
        },
      })
    },
    onSuccess: async (_, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: queryKeys.clothingTypeImages(variables.typeId),
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.barcodeImages(),
        }),
      ])
    },
  })
