package io.github.simonhauck.openfirestationmanager.user

import org.springframework.boot.resttestclient.TestRestTemplate
import org.springframework.boot.resttestclient.postForEntity
import org.springframework.http.HttpEntity
import org.springframework.http.HttpHeaders
import org.springframework.http.ProblemDetail
import org.springframework.http.ResponseEntity
import org.springframework.stereotype.Component

@Component
class AdminUserControllerCalls(private val testRestTemplate: TestRestTemplate) {

    fun createUser(
        request: CreateUserRequest,
        authCookie: String? = null,
    ): ResponseEntity<UserAccount> {
        return testRestTemplate.postForEntity<UserAccount>(
            "/api/admin/users",
            HttpEntity(request, headersWithCookie(authCookie)),
        )
    }

    fun createUserExpectingError(
        request: CreateUserRequest,
        authCookie: String? = null,
    ): ResponseEntity<ProblemDetail> {
        return testRestTemplate.postForEntity<ProblemDetail>(
            "/api/admin/users",
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
