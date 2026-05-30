package io.github.simonhauck.openfirestationmanager.privacypolicy

import java.time.ZonedDateTime

/** Metadata describing the currently active privacy policy document (without the binary blob). */
data class PrivacyPolicyMetadata(
    val fileName: String,
    val contentType: String,
    val fileSize: Long,
    val uploadedAt: ZonedDateTime,
)

/** The full privacy policy document including its binary content. */
class PrivacyPolicyDocument(
    val fileName: String,
    val contentType: String,
    val fileSize: Long,
    val uploadedAt: ZonedDateTime,
    val content: ByteArray,
) {
    fun toMetadata(): PrivacyPolicyMetadata =
        PrivacyPolicyMetadata(
            fileName = fileName,
            contentType = contentType,
            fileSize = fileSize,
            uploadedAt = uploadedAt,
        )
}
