package io.github.simonhauck.openfirestationmanager.legal.impressum

import io.github.simonhauck.openfirestationmanager.IntegrationTest
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.http.HttpStatus

class ImpressumAdminControllerIT : IntegrationTest() {

    @Autowired private lateinit var calls: ImpressumAdminControllerCalls

    @Test
    fun `upsert should create an impressum and return it`() {
        val request =
            ImpressumRequest(
                name = "Feuerwehr Musterstadt",
                address = "Musterstraße 1\n12345 Musterstadt",
                contactEmail = "info@feuerwehr-musterstadt.de",
                phone = "+49 123 456789",
            )

        val response = calls.upsert(request, authCookie = validCookieHeader)

        assertThat(response.statusCode).isEqualTo(HttpStatus.OK)
        assertThat(response.body?.name).isEqualTo(request.name)
        assertThat(response.body?.address).isEqualTo(request.address)
        assertThat(response.body?.contactEmail).isEqualTo(request.contactEmail)
        assertThat(response.body?.phone).isEqualTo(request.phone)
    }

    @Test
    fun `upsert should replace the existing impressum`() {
        calls.upsert(
            ImpressumRequest(
                name = "Old Name",
                address = "Old Address",
                contactEmail = "old@example.com",
                phone = null,
            ),
            authCookie = validCookieHeader,
        )

        val updated =
            calls.upsert(
                ImpressumRequest(
                    name = "New Name",
                    address = "New Address",
                    contactEmail = "new@example.com",
                    phone = null,
                ),
                authCookie = validCookieHeader,
            )

        assertThat(updated.body?.name).isEqualTo("New Name")
    }

    @Test
    fun `delete should remove the impressum`() {
        calls.upsert(
            ImpressumRequest(
                name = "Feuerwehr",
                address = "Straße 1",
                contactEmail = "mail@example.com",
                phone = null,
            ),
            authCookie = validCookieHeader,
        )

        val deleteResponse = calls.delete(authCookie = validCookieHeader)
        assertThat(deleteResponse.statusCode).isEqualTo(HttpStatus.NO_CONTENT)
    }
}
