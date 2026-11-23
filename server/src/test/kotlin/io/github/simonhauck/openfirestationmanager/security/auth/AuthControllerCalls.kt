package io.github.simonhauck.openfirestationmanager.security.auth

import org.springframework.boot.resttestclient.TestRestTemplate
import org.springframework.boot.resttestclient.exchange
import org.springframework.http.HttpEntity
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpMethod
import org.springframework.http.ProblemDetail
import org.springframework.http.ResponseEntity
import org.springframework.stereotype.Component

@Component
class AuthControllerCalls(private val testRestTemplate: TestRestTemplate) {

    fun me(authCookie: String? = null): ResponseEntity<AuthStateResponse> {
        return testRestTemplate.exchange<AuthStateResponse>(
            "/api/public/auth/me",
            HttpMethod.GET,
            HttpEntity<Unit>(headersWithCookie(authCookie)),
        )
    }

    /** Calls an arbitrary protected endpoint, to observe how missing authentication is handled. */
    fun protectedEndpoint(authCookie: String? = null): ResponseEntity<ProblemDetail> {
        return testRestTemplate.exchange<ProblemDetail>(
            "/api/clothing/types",
            HttpMethod.GET,
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
