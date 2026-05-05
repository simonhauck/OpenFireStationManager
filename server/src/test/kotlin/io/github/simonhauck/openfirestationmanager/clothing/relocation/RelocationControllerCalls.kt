package io.github.simonhauck.openfirestationmanager.clothing.relocation

import org.springframework.boot.resttestclient.TestRestTemplate
import org.springframework.boot.resttestclient.postForEntity
import org.springframework.http.HttpEntity
import org.springframework.http.HttpHeaders
import org.springframework.http.ProblemDetail
import org.springframework.http.ResponseEntity
import org.springframework.stereotype.Component

@Component
class RelocationControllerCalls(private val testRestTemplate: TestRestTemplate) {

    fun relocate(
        request: RelocationRequest,
        authCookie: String? = null,
    ): ResponseEntity<RelocationResponse> {
        return testRestTemplate.postForEntity<RelocationResponse>(
            "/api/clothing/relocation",
            HttpEntity(request, headersWithCookie(authCookie)),
        )
    }

    fun relocateExpectingError(
        request: RelocationRequest,
        authCookie: String? = null,
    ): ResponseEntity<ProblemDetail> {
        return testRestTemplate.postForEntity<ProblemDetail>(
            "/api/clothing/relocation",
            HttpEntity(request, headersWithCookie(authCookie)),
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
