package io.github.simonhauck.openfirestationmanager.clothing.type

import io.github.simonhauck.openfirestationmanager.common.NotFoundException
import io.github.simonhauck.openfirestationmanager.common.PublicApiException
import org.springframework.data.jdbc.core.mapping.AggregateReference
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.multipart.MultipartFile

@Service
class ClothingTypeImageService(
    private val repository: ClothingTypeImageRepository,
    private val clothingTypeService: ClothingTypeService,
) {

    @Transactional
    fun upload(typeId: Long, file: MultipartFile): ClothingTypeImageMetadata {
        clothingTypeService.getTypeById(typeId)
        val contentType = file.contentType
        if (contentType == null || contentType !in ACCEPTED_CONTENT_TYPES) {
            throw PublicApiException(
                status = HttpStatus.UNPROCESSABLE_ENTITY,
                publicMessage =
                    "Unsupported image type. Allowed types are: ${ACCEPTED_CONTENT_TYPES.joinToString(", ")}",
            )
        }
        if (file.size > MAX_IMAGE_SIZE_BYTES) {
            throw PublicApiException(
                status = HttpStatus.UNPROCESSABLE_ENTITY,
                publicMessage = "Image is too large. Maximum size is 5 MB.",
            )
        }

        val image =
            ClothingTypeImage(
                typeId = AggregateReference.to(typeId),
                contentType = contentType,
                fileSize = file.size,
                content = file.bytes,
            )
        return repository.save(image).toMetadata()
    }

    fun listImages(typeId: Long): List<ClothingTypeImageMetadata> {
        clothingTypeService.getTypeById(typeId)
        return repository.findAllByTypeIdOrderByIdAsc(AggregateReference.to(typeId)).map {
            it.toMetadata()
        }
    }

    fun listBarcodeImages(): List<ClothingTypeBarcodeImages> {
        val imagesByType = repository.findAll().groupBy { it.typeId.id }
        if (imagesByType.isEmpty()) {
            return emptyList()
        }
        return clothingTypeService
            .getAllTypes()
            .filter { imagesByType.containsKey(it.id) }
            .map { type ->
                ClothingTypeBarcodeImages(
                    typeId = type.id,
                    typeName = type.name,
                    images =
                        imagesByType.getValue(type.id).sortedBy { it.id }.map { it.toMetadata() },
                )
            }
    }

    fun getImage(typeId: Long, imageId: Long): ClothingTypeImage {
        val image = repository.findById(imageId)
        if (image == null || image.typeId.id != typeId) {
            throw NotFoundException("Clothing type image not found for id: $imageId")
        }
        return image
    }

    fun deleteImage(typeId: Long, imageId: Long) {
        getImage(typeId, imageId)
        repository.deleteById(imageId)
    }

    companion object {
        val ACCEPTED_CONTENT_TYPES = setOf("image/jpeg", "image/png", "image/webp")
        const val MAX_IMAGE_SIZE_BYTES = 5L * 1024 * 1024
    }
}
