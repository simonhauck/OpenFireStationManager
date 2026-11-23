package io.github.simonhauck.openfirestationmanager.testing

import io.github.simonhauck.openfirestationmanager.usermanagement.UserRole
import org.springframework.boot.resttestclient.TestRestTemplate
import org.springframework.boot.resttestclient.postForEntity
import org.springframework.http.HttpHeaders
import org.springframework.http.ResponseEntity
import org.springframework.stereotype.Component

@Component
class TestSessionControllerCalls(private val testRestTemplate: TestRestTemplate) {

    fun createSession(request: TestSessionRequest): ResponseEntity<Void> {
        return testRestTemplate.postForEntity<Void>("/api/test/session", request)
    }

    /** Creates a session for the given identity and returns it as a `Cookie` header value. */
    fun createSessionCookie(
        roles: List<UserRole>,
        username: String = "test-session-user",
        firstName: String = "Test",
        lastName: String = "User",
    ): String {
        val response =
            createSession(
                TestSessionRequest(
                    username = username,
                    firstName = firstName,
                    lastName = lastName,
                    roles = roles,
                ),
            )
        return extractAuthCookie(response) ?: error("No auth cookie returned for test session")
    }

    fun extractAuthCookie(response: ResponseEntity<*>): String? {
        return response.headers[HttpHeaders.SET_COOKIE]?.firstNotNullOfOrNull { setCookieHeader ->
            setCookieHeader.split("; ").find { cookiePart -> cookiePart.startsWith("OFSM_AUTH=") }
        }
    }
}
