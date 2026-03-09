package io.github.simonhauck.openfirestationmanager.user

import org.springframework.boot.resttestclient.TestRestTemplate
import org.springframework.boot.resttestclient.exchange
import org.springframework.boot.resttestclient.postForEntity
import org.springframework.http.HttpEntity
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpMethod
import org.springframework.http.ProblemDetail
import org.springframework.http.ResponseEntity
import org.springframework.stereotype.Component

@Component
class AdminUserControllerCalls(private val testRestTemplate: TestRestTemplate) {

    fun getAllUsers(authCookie: String? = null): ResponseEntity<Array<UserAccount>> {
        return testRestTemplate.exchange<Array<UserAccount>>(
            "/api/admin/users",
            HttpMethod.GET,
            HttpEntity<Unit>(headersWithCookie(authCookie)),
        )
    }

    fun getAllUsersExpectingError(authCookie: String? = null): ResponseEntity<ProblemDetail> {
        return testRestTemplate.exchange<ProblemDetail>(
            "/api/admin/users",
            HttpMethod.GET,
            HttpEntity<Unit>(headersWithCookie(authCookie)),
        )
    }

    fun createUser(
        request: CreateUserRequest,
        authCookie: String? = null,
    ): ResponseEntity<UserAccount> {
        return testRestTemplate.postForEntity<UserAccount>(
            "/api/admin/users",
            HttpEntity(request, headersWithCookie(authCookie)),
        )
    }

    fun updateUser(
        id: Long,
        request: UpdateUserRequest,
        authCookie: String? = null,
    ): ResponseEntity<UserAccount> {
        return testRestTemplate.exchange<UserAccount>(
            "/api/admin/users/$id",
            HttpMethod.PATCH,
            HttpEntity(request, headersWithCookie(authCookie)),
        )
    }

    fun updateUserExpectingError(
        id: Long,
        request: UpdateUserRequest,
        authCookie: String? = null,
    ): ResponseEntity<ProblemDetail> {
        return testRestTemplate.exchange<ProblemDetail>(
            "/api/admin/users/$id",
            HttpMethod.PATCH,
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
