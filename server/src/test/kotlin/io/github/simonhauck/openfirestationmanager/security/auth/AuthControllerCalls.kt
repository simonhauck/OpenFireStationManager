package io.github.simonhauck.openfirestationmanager.security.auth

import org.springframework.boot.resttestclient.TestRestTemplate
import org.springframework.boot.resttestclient.exchange
import org.springframework.boot.resttestclient.postForEntity
import org.springframework.http.HttpEntity
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpMethod
import org.springframework.http.ResponseEntity
import org.springframework.stereotype.Component

@Component
class AuthControllerCalls(private val testRestTemplate: TestRestTemplate) {

    fun login(request: LoginRequest): ResponseEntity<Void> {
        return testRestTemplate.postForEntity<Void>("/api/public/auth/login", request)
    }

    fun logout(authCookie: String? = null): ResponseEntity<Void> {
        return testRestTemplate.exchange<Void>(
            "/api/public/auth/logout",
            HttpMethod.POST,
            HttpEntity<Unit>(headersWithCookie(authCookie)),
        )
    }

    fun me(authCookie: String? = null): ResponseEntity<AuthStateResponse> {
        return testRestTemplate.exchange<AuthStateResponse>(
            "/api/public/auth/me",
            HttpMethod.GET,
            HttpEntity<Unit>(headersWithCookie(authCookie)),
        )
    }

    fun extractAuthCookie(response: ResponseEntity<*>): String? {
        return response.headers.getFirst(HttpHeaders.SET_COOKIE)?.split("; ")?.find {
            it.contains("OFSM_AUTH")
        }
    }

    private fun headersWithCookie(authCookie: String?): HttpHeaders {
        val headers = HttpHeaders()
        if (authCookie != null) {
            headers.add(HttpHeaders.COOKIE, authCookie)
        }
        return headers
    }
}
