package io.github.simonhauck.openfirestationmanager.privacypolicy

import org.springframework.boot.resttestclient.TestRestTemplate
import org.springframework.boot.resttestclient.exchange
import org.springframework.core.io.ByteArrayResource
import org.springframework.http.HttpEntity
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpMethod
import org.springframework.http.MediaType
import org.springframework.http.ProblemDetail
import org.springframework.http.ResponseEntity
import org.springframework.stereotype.Component
import org.springframework.util.LinkedMultiValueMap

@Component
class PrivacyPolicyAdminControllerCalls(private val testRestTemplate: TestRestTemplate) {

    fun upload(
        fileName: String,
        contentType: String,
        content: ByteArray,
        authCookie: String? = null,
    ): ResponseEntity<PrivacyPolicyMetadata> {
        val filePartHeaders =
            HttpHeaders().apply { this.contentType = MediaType.parseMediaType(contentType) }
        val fileResource =
            object : ByteArrayResource(content) {
                override fun getFilename(): String = fileName
            }
        val filePart = HttpEntity(fileResource, filePartHeaders)

        val body = LinkedMultiValueMap<String, Any>()
        body.add("file", filePart)

        val headers = headersWithCookie(authCookie)
        headers.contentType = MediaType.MULTIPART_FORM_DATA

        return testRestTemplate.exchange<PrivacyPolicyMetadata>(
            "/api/admin/privacy-policy",
            HttpMethod.POST,
            HttpEntity(body, headers),
        )
    }

    fun getMetadata(authCookie: String? = null): ResponseEntity<PrivacyPolicyMetadata> {
        return testRestTemplate.exchange<PrivacyPolicyMetadata>(
            "/api/admin/privacy-policy",
            HttpMethod.GET,
            HttpEntity<Unit>(headersWithCookie(authCookie)),
        )
    }

    fun getMetadataExpectingError(authCookie: String? = null): ResponseEntity<ProblemDetail> {
        return testRestTemplate.exchange<ProblemDetail>(
            "/api/admin/privacy-policy",
            HttpMethod.GET,
            HttpEntity<Unit>(headersWithCookie(authCookie)),
        )
    }

    fun delete(authCookie: String? = null): ResponseEntity<Void> {
        return testRestTemplate.exchange<Void>(
            "/api/admin/privacy-policy",
            HttpMethod.DELETE,
            HttpEntity<Unit>(headersWithCookie(authCookie)),
        )
    }

    private fun headersWithCookie(authCookie: String?): HttpHeaders {
        val headers = HttpHeaders()
        if (authCookie != null) {
            headers.add(HttpHeaders.COOKIE, authCookie)
        }
        return headers
    }
}
