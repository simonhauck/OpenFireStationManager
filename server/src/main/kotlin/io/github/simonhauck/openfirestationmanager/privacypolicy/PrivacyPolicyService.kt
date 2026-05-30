package io.github.simonhauck.openfirestationmanager.privacypolicy

import io.github.simonhauck.openfirestationmanager.common.PublicApiException
import java.time.ZoneOffset
import java.time.ZonedDateTime
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.multipart.MultipartFile

@Service
class PrivacyPolicyService(private val repository: PrivacyPolicyRepository) {

    @Transactional
    fun upload(file: MultipartFile): PrivacyPolicyMetadata {
        val contentType = file.contentType
        if (contentType == null || contentType !in ACCEPTED_CONTENT_TYPES) {
            throw PublicApiException(
                status = HttpStatus.UNPROCESSABLE_ENTITY,
                publicMessage =
                    "Unsupported file type. Allowed types are: ${ACCEPTED_CONTENT_TYPES.joinToString(", ")}",
            )
        }

        if (file.size > MAX_FILE_SIZE_BYTES) {
            throw PublicApiException(
                status = HttpStatus.UNPROCESSABLE_ENTITY,
                publicMessage = "File is too large. Maximum allowed size is 10 MB",
            )
        }

        val document =
            PrivacyPolicyDocument(
                fileName = file.originalFilename ?: "privacy-policy",
                contentType = contentType,
                fileSize = file.size,
                uploadedAt = ZonedDateTime.now(ZoneOffset.UTC),
                content = file.bytes,
            )
        repository.save(document)
        return document.toMetadata()
    }

    @Transactional fun delete() = repository.delete()

    fun getDocument(): PrivacyPolicyDocument? = repository.find()

    fun getMetadata(): PrivacyPolicyMetadata =
        repository.find()?.toMetadata()
            ?: throw PublicApiException(
                status = HttpStatus.NOT_FOUND,
                publicMessage = "No privacy policy document has been uploaded",
            )

    companion object {
        private const val MAX_FILE_SIZE_BYTES = 10L * 1024 * 1024

        val ACCEPTED_CONTENT_TYPES = setOf("application/pdf", "text/html", "text/plain")
    }
}
