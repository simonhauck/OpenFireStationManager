package io.github.simonhauck.openfirestationmanager.privacypolicy

import io.github.simonhauck.openfirestationmanager.IntegrationTest
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.http.HttpStatus

class PrivacyPolicyAdminControllerIT : IntegrationTest() {

    @Autowired private lateinit var calls: PrivacyPolicyAdminControllerCalls

    @Test
    fun `upload should store a PDF document and return its metadata`() {
        val response =
            calls.upload(
                fileName = "policy.pdf",
                contentType = "application/pdf",
                content = "%PDF-1.4 example".toByteArray(),
                authCookie = validCookieHeader,
            )

        assertThat(response.statusCode).isEqualTo(HttpStatus.CREATED)
        assertThat(response.body?.fileName).isEqualTo("policy.pdf")
        assertThat(response.body?.contentType).isEqualTo("application/pdf")
    }

    @Test
    fun `upload should accept an HTML document`() {
        val response =
            calls.upload(
                fileName = "policy.html",
                contentType = "text/html",
                content = "<h1>Policy</h1>".toByteArray(),
                authCookie = validCookieHeader,
            )

        assertThat(response.statusCode).isEqualTo(HttpStatus.CREATED)
        assertThat(response.body?.contentType).isEqualTo("text/html")
    }

    @Test
    fun `upload should accept a plain text document`() {
        val response =
            calls.upload(
                fileName = "policy.txt",
                contentType = "text/plain",
                content = "Policy".toByteArray(),
                authCookie = validCookieHeader,
            )

        assertThat(response.statusCode).isEqualTo(HttpStatus.CREATED)
        assertThat(response.body?.contentType).isEqualTo("text/plain")
    }

    @Test
    fun `upload should replace the previously active document`() {
        calls.upload(
            fileName = "old-policy.pdf",
            contentType = "application/pdf",
            content = "old".toByteArray(),
            authCookie = validCookieHeader,
        )

        calls.upload(
            fileName = "new-policy.pdf",
            contentType = "application/pdf",
            content = "new".toByteArray(),
            authCookie = validCookieHeader,
        )

        val metadata = calls.getMetadata(authCookie = validCookieHeader)

        assertThat(metadata.statusCode).isEqualTo(HttpStatus.OK)
        assertThat(metadata.body?.fileName).isEqualTo("new-policy.pdf")
    }

    @Test
    fun `delete should remove the active document so that metadata returns 404`() {
        calls.upload(
            fileName = "policy.pdf",
            contentType = "application/pdf",
            content = "content".toByteArray(),
            authCookie = validCookieHeader,
        )

        val deleteResponse = calls.delete(authCookie = validCookieHeader)
        assertThat(deleteResponse.statusCode).isEqualTo(HttpStatus.NO_CONTENT)

        val metadata = calls.getMetadataExpectingError(authCookie = validCookieHeader)
        assertThat(metadata.statusCode).isEqualTo(HttpStatus.NOT_FOUND)
    }
}
