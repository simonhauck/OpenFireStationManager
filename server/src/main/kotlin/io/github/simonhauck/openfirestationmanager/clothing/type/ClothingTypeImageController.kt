package io.github.simonhauck.openfirestationmanager.clothing.type

import io.github.simonhauck.openfirestationmanager.common.ApiTags
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.Parameter
import io.swagger.v3.oas.annotations.media.Content
import io.swagger.v3.oas.annotations.media.Schema
import io.swagger.v3.oas.annotations.responses.ApiResponse
import io.swagger.v3.oas.annotations.responses.ApiResponses
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.constraints.Positive
import java.time.Duration
import org.springframework.http.CacheControl
import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
import org.springframework.http.ProblemDetail
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.validation.annotation.Validated
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController
import org.springframework.web.multipart.MultipartFile

@RestController
@RequestMapping("/api/clothing")
@Validated
@Tag(name = ApiTags.CLOTHING_TYPES)
class ClothingTypeImageController(private val service: ClothingTypeImageService) {

    @PostMapping("/types/{typeId}/images", consumes = [MediaType.MULTIPART_FORM_DATA_VALUE])
    @Operation(
        operationId = "uploadClothingTypeImage",
        summary = "Upload a barcode guide image for a clothing type",
        description =
            "Stores one image (`Barcode-Bild`) that shows where on a garment its barcode is " +
                "located, so people scanning items can find it. A type may have zero or more " +
                "images; upload each image as its own request — there is no batch upload.\n\n" +
                "Only `image/jpeg`, `image/png`, and `image/webp` are accepted, up to 5 MB each; " +
                "HEIC is not supported. Images are stored exactly as uploaded and cannot be " +
                "edited afterwards — replacing one means deleting it and uploading a new file.",
    )
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Details of the newly stored image."),
        ApiResponse(
            responseCode = "404",
            description = "No clothing type exists with this id. Nothing was stored.",
            content =
                [
                    Content(
                        mediaType = "application/problem+json",
                        schema = Schema(implementation = ProblemDetail::class),
                    )
                ],
        ),
        ApiResponse(
            responseCode = "422",
            description =
                "The file is not a JPEG, PNG, or WebP, or it exceeds 5 MB. Nothing was stored.",
            content =
                [
                    Content(
                        mediaType = "application/problem+json",
                        schema = Schema(implementation = ProblemDetail::class),
                    )
                ],
        ),
    )
    @PreAuthorize("hasRole('ROLE_KLEIDERWART')")
    fun uploadImage(
        @Parameter(description = "Numeric id of the clothing type.", example = "3")
        @PathVariable
        @Positive
        typeId: Long,
        @Parameter(
            description =
                "The image to store. A JPEG, PNG, or WebP file of at most 5 MB, showing where " +
                    "the barcode is located on the garment."
        )
        @RequestParam("file")
        file: MultipartFile,
    ): ClothingTypeImageMetadata = service.upload(typeId, file)

    @GetMapping("/types/barcode-images")
    @Operation(
        operationId = "listBarcodeImages",
        summary = "List every barcode guide image, grouped by clothing type",
        description =
            "Returns all stored images (`Barcode-Bild`) across every clothing type, grouped under " +
                "the type they belong to and accompanied by the type's name. This is the one call " +
                "the scanner screens need to render the \"where do I find the barcode?\" gallery; " +
                "image bytes are still fetched per image from " +
                "`GET /api/clothing/types/{typeId}/images/{imageId}`.\n\n" +
                "Types without images are omitted, so an empty response means the gallery has " +
                "nothing to show.",
    )
    @ApiResponses(ApiResponse(responseCode = "200", description = "All images, grouped by type."))
    fun listBarcodeImages(): List<ClothingTypeBarcodeImages> = service.listBarcodeImages()

    @GetMapping("/types/{typeId}/images")
    @Operation(
        operationId = "listClothingTypeImages",
        summary = "List the barcode guide images of a clothing type",
        description =
            "Returns the metadata of every image (`Barcode-Bild`) stored for one clothing type, " +
                "in upload order — but not the image bytes. Use this on a type's management " +
                "screen to render previews; download each image from " +
                "`GET /api/clothing/types/{typeId}/images/{imageId}`.\n\n" +
                "For the scanner gallery across all types, prefer " +
                "`GET /api/clothing/types/barcode-images`, which answers in one call.",
    )
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Metadata of the type's images."),
        ApiResponse(
            responseCode = "404",
            description = "No clothing type exists with this id.",
            content =
                [
                    Content(
                        mediaType = "application/problem+json",
                        schema = Schema(implementation = ProblemDetail::class),
                    )
                ],
        ),
    )
    fun listImages(
        @Parameter(description = "Numeric id of the clothing type.", example = "3")
        @PathVariable
        @Positive
        typeId: Long
    ): List<ClothingTypeImageMetadata> = service.listImages(typeId)

    @GetMapping("/types/{typeId}/images/{imageId}")
    @Operation(
        operationId = "getClothingTypeImage",
        summary = "Download one barcode guide image",
        description =
            "Streams the stored image bytes (`Barcode-Bild`) exactly as uploaded, with the MIME " +
                "type they were stored with. The response is the raw image, not JSON.\n\n" +
                "Stored bytes never change, so responses are cacheable indefinitely; the `ETag` " +
                "is derived from the image's id. Replacing an image means deleting it and " +
                "uploading a new file, which produces a new id and therefore a new URL.",
    )
    @ApiResponses(
        ApiResponse(
            responseCode = "200",
            description = "The image bytes, in the MIME type the image was uploaded with.",
            content =
                [
                    Content(
                        mediaType = "application/octet-stream",
                        schema = Schema(type = "string", format = "binary"),
                    )
                ],
        ),
        ApiResponse(
            responseCode = "404",
            description = "No image with this id exists for this clothing type.",
            content =
                [
                    Content(
                        mediaType = "application/problem+json",
                        schema = Schema(implementation = ProblemDetail::class),
                    )
                ],
        ),
    )
    fun getImage(
        @Parameter(description = "Numeric id of the clothing type.", example = "3")
        @PathVariable
        @Positive
        typeId: Long,
        @Parameter(description = "Numeric id of the image.", example = "12")
        @PathVariable
        @Positive
        imageId: Long,
    ): ResponseEntity<ByteArray> {
        val image = service.getImage(typeId, imageId)
        return ResponseEntity.ok()
            .contentType(MediaType.parseMediaType(image.contentType))
            .cacheControl(CacheControl.maxAge(Duration.ofDays(365)).immutable())
            .eTag("\"${image.id}\"")
            .body(image.content)
    }

    @DeleteMapping("/types/{typeId}/images/{imageId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(
        operationId = "deleteClothingTypeImage",
        summary = "Delete a barcode guide image",
        description =
            "Removes one image (`Barcode-Bild`) from a clothing type. The image disappears from " +
                "every scanner screen immediately. There is no way to replace an image in place — " +
                "delete it and upload a new file instead.",
    )
    @ApiResponses(
        ApiResponse(responseCode = "204", description = "The image was deleted."),
        ApiResponse(
            responseCode = "404",
            description = "No image with this id exists for this clothing type.",
            content =
                [
                    Content(
                        mediaType = "application/problem+json",
                        schema = Schema(implementation = ProblemDetail::class),
                    )
                ],
        ),
    )
    @PreAuthorize("hasRole('ROLE_KLEIDERWART')")
    fun deleteImage(
        @Parameter(description = "Numeric id of the clothing type.", example = "3")
        @PathVariable
        @Positive
        typeId: Long,
        @Parameter(description = "Numeric id of the image to delete.", example = "12")
        @PathVariable
        @Positive
        imageId: Long,
    ) {
        service.deleteImage(typeId, imageId)
    }
}
