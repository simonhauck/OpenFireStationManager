package io.github.simonhauck.openfirestationmanager.privacypolicy

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

@Table("privacy_policy")
data class PrivacyPolicyDocument(
    val fileName: String,
    val contentType: String,
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
}
