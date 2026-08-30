package io.github.simonhauck.openfirestationmanager.legal.privacypolicy

import io.github.simonhauck.openfirestationmanager.db.BaseEntity
import io.github.simonhauck.openfirestationmanager.db.EntityMetaData
import io.swagger.v3.oas.annotations.media.Schema
import java.time.ZonedDateTime
import org.springframework.data.annotation.Id
import org.springframework.data.relational.core.mapping.Embedded
import org.springframework.data.relational.core.mapping.Table

@Schema(
    description =
        "Details about the stored privacy policy file, without its contents. Download the file " +
            "itself from `GET /privacy-policy`."
)
data class PrivacyPolicyMetadata(
    @field:Schema(
        description = "Original name of the uploaded file.",
        example = "datenschutzerklaerung.pdf",
    )
    val fileName: String,
    @field:Schema(
        description =
            "MIME type of the stored file — one of `application/pdf`, `text/html`, " +
                "or `text/plain`.",
        example = "application/pdf",
    )
    val contentType: String,
    @field:Schema(description = "Size of the file in bytes.", example = "254118")
    val fileSize: Long,
    @field:Schema(description = "When the file was uploaded.") val uploadedAt: ZonedDateTime,
)

@Schema(
    description =
        "Whether a privacy policy document has been uploaded. Lets a caller check without " +
            "downloading the file."
)
data class PrivacyPolicyExists(
    @field:Schema(description = "True when a document is stored.", example = "true")
    val exists: Boolean
)

@Table("privacy_policy")
data class PrivacyPolicyDocument(
    val fileName: String,
    val contentType: String,
    val charset: String?,
    val fileSize: Long,
    val uploadedAt: ZonedDateTime,
    val content: ByteArray,
    @Id override val id: Long = 0,
    @Embedded.Nullable override val metaData: EntityMetaData = EntityMetaData(),
) : BaseEntity<PrivacyPolicyDocument> {
    override fun copyWithMetaData(metaData: EntityMetaData): BaseEntity<PrivacyPolicyDocument> =
        copy(metaData = metaData)

    fun toMetadata(): PrivacyPolicyMetadata =
        PrivacyPolicyMetadata(
            fileName = fileName,
            contentType = contentType,
            fileSize = fileSize,
            uploadedAt = uploadedAt,
        )

    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (javaClass != other?.javaClass) return false

        other as PrivacyPolicyDocument

        if (fileSize != other.fileSize) return false
        if (id != other.id) return false
        if (fileName != other.fileName) return false
        if (contentType != other.contentType) return false
        if (charset != other.charset) return false
        if (uploadedAt != other.uploadedAt) return false
        if (!content.contentEquals(other.content)) return false
        if (metaData != other.metaData) return false

        return true
    }

    override fun hashCode(): Int {
        var result = fileSize.hashCode()
        result = 31 * result + id.hashCode()
        result = 31 * result + fileName.hashCode()
        result = 31 * result + contentType.hashCode()
        result = 31 * result + (charset?.hashCode() ?: 0)
        result = 31 * result + uploadedAt.hashCode()
        result = 31 * result + content.contentHashCode()
        result = 31 * result + metaData.hashCode()
        return result
    }
}
