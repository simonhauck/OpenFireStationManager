package io.github.simonhauck.openfirestationmanager.legal.impressum

import org.springframework.boot.resttestclient.TestRestTemplate
import org.springframework.boot.resttestclient.exchange
import org.springframework.http.HttpEntity
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpMethod
import org.springframework.http.ResponseEntity
import org.springframework.stereotype.Component

@Component
class ImpressumAdminControllerCalls(private val testRestTemplate: TestRestTemplate) {

    fun upsert(request: ImpressumDto, authCookie: String? = null): ResponseEntity<ImpressumDto> {
        return testRestTemplate.exchange<ImpressumDto>(
            "/api/admin/impressum",
            HttpMethod.PUT,
            HttpEntity(request, headersWithCookie(authCookie)),
        )
    }

    fun get(authCookie: String? = null): ResponseEntity<ImpressumDto> {
        return testRestTemplate.exchange<ImpressumDto>(
            "/api/admin/impressum",
            HttpMethod.GET,
            HttpEntity<Unit>(headersWithCookie(authCookie)),
        )
    }

    fun delete(authCookie: String? = null): ResponseEntity<Void> {
        return testRestTemplate.exchange<Void>(
            "/api/admin/impressum",
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
