package io.github.simonhauck.openfirestationmanager.legal.privacypolicy

import io.github.simonhauck.openfirestationmanager.IntegrationTest
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.http.HttpStatus
import java.nio.charset.StandardCharsets
import org.springframework.http.MediaType

class PrivacyPolicyPublicControllerIT : IntegrationTest() {

    @Autowired private lateinit var adminCalls: PrivacyPolicyAdminControllerCalls
    @Autowired private lateinit var publicCalls: PrivacyPolicyPublicControllerCalls

    @Test
    fun `should serve the uploaded document with the stored content type`() {
        val content = "Datenschutzerklärung".toByteArray()
        adminCalls.upload(
            fileName = "policy.txt",
            contentType = "text/plain",
            content = content,
            authCookie = validCookieHeader,
        )

        val response = publicCalls.getPrivacyPolicy()

        assertThat(response.statusCode).isEqualTo(HttpStatus.OK)
        assertThat(response.headers.contentType?.isCompatibleWith(MediaType.TEXT_PLAIN)).isTrue()
        assertThat(response.headers.contentType?.charset).isEqualTo(StandardCharsets.UTF_8)
        assertThat(response.body).isEqualTo(content)
    }

    @Test
    fun `should return 404 when no document is present`() {
        adminCalls.delete(authCookie = validCookieHeader)

        val response = publicCalls.getPrivacyPolicy()

        assertThat(response.statusCode).isEqualTo(HttpStatus.NOT_FOUND)
    }
}
