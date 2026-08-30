package io.github.simonhauck.openfirestationmanager.member

import org.springframework.boot.resttestclient.TestRestTemplate
import org.springframework.boot.resttestclient.exchange
import org.springframework.boot.resttestclient.postForEntity
import org.springframework.http.HttpEntity
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpMethod
import org.springframework.http.ResponseEntity
import org.springframework.stereotype.Component

@Component
class MemberControllerCalls(private val testRestTemplate: TestRestTemplate) {

    fun getAllMembers(authCookie: String? = null): ResponseEntity<Array<Member>> {
        return testRestTemplate.exchange<Array<Member>>(
            "/api/members",
            HttpMethod.GET,
            HttpEntity<Unit>(headersWithCookie(authCookie)),
        )
    }

    fun getMemberById(id: Long, authCookie: String? = null): ResponseEntity<Member> {
        return testRestTemplate.exchange<Member>(
            "/api/members/$id",
            HttpMethod.GET,
            HttpEntity<Unit>(headersWithCookie(authCookie)),
        )
    }

    fun createMember(
        request: CreateOrUpdateMemberRequest,
        authCookie: String? = null,
    ): ResponseEntity<Member> {
        return testRestTemplate.postForEntity<Member>(
            "/api/members",
            HttpEntity(request, headersWithCookie(authCookie)),
        )
    }

    fun updateMember(
        id: Long,
        request: CreateOrUpdateMemberRequest,
        authCookie: String? = null,
    ): ResponseEntity<Member> {
        return testRestTemplate.exchange<Member>(
            "/api/members/$id",
            HttpMethod.PATCH,
            HttpEntity(request, headersWithCookie(authCookie)),
        )
    }

    fun deleteMember(id: Long, authCookie: String? = null): ResponseEntity<Void> {
        return testRestTemplate.exchange<Void>(
            "/api/members/$id",
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
