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

        repository.deleteAll()
        val document =
            PrivacyPolicyDocument(
                fileName = file.originalFilename ?: "privacy-policy",
                contentType = contentType,
                fileSize = file.size,
                uploadedAt = ZonedDateTime.now(ZoneOffset.UTC),
                content = file.bytes,
            )
        return repository.save(document).toMetadata()
    }

    fun delete() = repository.deleteAll()

    fun getDocument(): PrivacyPolicyDocument? = repository.findAll().firstOrNull()

    fun getMetadata(): PrivacyPolicyMetadata =
        getDocument()?.toMetadata()
            ?: throw PublicApiException(
                status = HttpStatus.NOT_FOUND,
                publicMessage = "No privacy policy document has been uploaded",
            )

    fun exists(): PrivacyPolicyExists = PrivacyPolicyExists(getDocument() != null)

    companion object {
        val ACCEPTED_CONTENT_TYPES = setOf("application/pdf", "text/html", "text/plain")
    }
}
