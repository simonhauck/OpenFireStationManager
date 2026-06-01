package io.github.simonhauck.openfirestationmanager.legal.privacypolicy

import io.github.simonhauck.openfirestationmanager.db.BaseEntity
import io.github.simonhauck.openfirestationmanager.db.EntityMetaData
import java.time.ZonedDateTime
import org.springframework.data.annotation.Id
import org.springframework.data.relational.core.mapping.Embedded
import org.springframework.data.relational.core.mapping.Table

data class PrivacyPolicyMetadata(
    val fileName: String,
    val contentType: String,
    val fileSize: Long,
    val uploadedAt: ZonedDateTime,
)

data class PrivacyPolicyExists(val exists: Boolean)

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
