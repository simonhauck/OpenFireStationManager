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

    fun login(
        username: String = "chief",
        password: String = "secret",
        rememberMe: Boolean = false,
    ): ResponseEntity<Void> {
        val request = LoginRequest(username = username, password = password, rememberMe = rememberMe)
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
        return extractCookie(response, "OFSM_AUTH")
    }

    fun extractRememberMeCookie(response: ResponseEntity<*>): String? {
        return extractCookie(response, "OFSM_AUTH_REMEMBER_ME")
    }

    private fun extractCookie(response: ResponseEntity<*>, cookieName: String): String? {
        return response.headers[HttpHeaders.SET_COOKIE]?.firstNotNullOfOrNull { setCookieHeader ->
            setCookieHeader
                .split("; ")
                .find { cookiePart -> cookiePart.startsWith("$cookieName=") }
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
