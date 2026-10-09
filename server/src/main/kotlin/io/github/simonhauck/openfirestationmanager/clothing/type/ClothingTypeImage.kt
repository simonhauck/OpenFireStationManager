package io.github.simonhauck.openfirestationmanager.clothing.type

import io.github.simonhauck.openfirestationmanager.db.BaseEntity
import io.github.simonhauck.openfirestationmanager.db.EntityMetaData
import io.swagger.v3.oas.annotations.media.Schema
import org.springframework.data.annotation.Id
import org.springframework.data.jdbc.core.mapping.AggregateReference
import org.springframework.data.relational.core.mapping.Embedded
import org.springframework.data.relational.core.mapping.Table

@Schema(
    description =
        "Details about one barcode guide image (`Barcode-Bild`) stored for a clothing type, " +
            "without its contents. Download the image itself from " +
            "`GET /api/clothing/types/{typeId}/images/{imageId}`."
)
data class ClothingTypeImageMetadata(
    @field:Schema(description = "Server-assigned identifier of the image.", example = "12")
    val id: Long,
    @field:Schema(
        description =
            "MIME type of the stored image — one of `image/jpeg`, `image/png`, or `image/webp`.",
        example = "image/jpeg",
    )
    val contentType: String,
    @field:Schema(description = "Size of the image in bytes.", example = "182734")
    val fileSize: Long,
)

@Schema(
    description =
        "Every barcode guide image (`Barcode-Bild`) of one clothing type, with the type's name " +
            "so a scanner screen can label the group without a second lookup."
)
data class ClothingTypeBarcodeImages(
    @field:Schema(description = "Id of the clothing type.", example = "3") val typeId: Long,
    @field:Schema(description = "Display name of the clothing type.", example = "Einsatzjacke")
    val typeName: String,
    @field:Schema(description = "The type's images, in upload order.")
    val images: List<ClothingTypeImageMetadata>,
)

@Table("clothing_type_images")
data class ClothingTypeImage(
    @field:Schema(
        implementation = Long::class,
        description = "Id of the clothing type this image belongs to.",
        example = "3",
    )
    val typeId: AggregateReference<ClothingType, Long>,
    @field:Schema(description = "MIME type the image was uploaded with.", example = "image/jpeg")
    val contentType: String,
    @field:Schema(description = "Size of the image in bytes.", example = "182734")
    val fileSize: Long,
    val content: ByteArray,
    @Id override val id: Long = 0,
    @Embedded.Nullable override val metaData: EntityMetaData = EntityMetaData(),
) : BaseEntity<ClothingTypeImage> {
    override fun copyWithMetaData(metaData: EntityMetaData): BaseEntity<ClothingTypeImage> =
        copy(metaData = metaData)

    fun toMetadata(): ClothingTypeImageMetadata =
        ClothingTypeImageMetadata(id = id, contentType = contentType, fileSize = fileSize)

    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (javaClass != other?.javaClass) return false

        other as ClothingTypeImage

        if (typeId != other.typeId) return false
        if (contentType != other.contentType) return false
        if (fileSize != other.fileSize) return false
        if (id != other.id) return false
        if (!content.contentEquals(other.content)) return false
        if (metaData != other.metaData) return false

        return true
    }

    override fun hashCode(): Int {
        var result = typeId.hashCode()
        result = 31 * result + contentType.hashCode()
        result = 31 * result + fileSize.hashCode()
        result = 31 * result + id.hashCode()
        result = 31 * result + content.contentHashCode()
        result = 31 * result + metaData.hashCode()
        return result
    }
}
