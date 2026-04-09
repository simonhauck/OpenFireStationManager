package io.github.simonhauck.openfirestationmanager.security.auth

import io.github.simonhauck.openfirestationmanager.IntegrationTest
import io.github.simonhauck.openfirestationmanager.testutil.snapshotTest
import java.time.ZonedDateTime
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpStatus

class AuthControllerIT() : IntegrationTest() {
    @Autowired private lateinit var authControllerCalls: AuthControllerCalls

    @Test
    fun `should return authenticated false when user does not provide a cookie`() {
        val response = authControllerCalls.me(null)

        assertThat(response.statusCode).isEqualTo(HttpStatus.OK)
        assertThat(response.body?.authenticated).isFalse
        assertThat(response.body?.user).isNull()
    }

    @Test
    fun `login should return an auth cookie that can be used with the 'me' endpoint to get the current user`() =
        snapshotTest(this) {
            val loginResponse =
                authControllerCalls.login(LoginRequest(username = "chief", password = "secret"))
            val authCookie = authControllerCalls.extractAuthCookie(loginResponse)

            assertThat(authCookie).isNotNull

            val meResponse = authControllerCalls.me(authCookie)

            assertThat(meResponse.statusCode).isEqualTo(HttpStatus.OK)
            meResponse.body.shouldEqualSnapshot("expected_me_response.json") {
                it.ignoringFields("user.id")
                it.ignoringFieldsOfTypes(ZonedDateTime::class.java)
            }
        }

    @Test
    fun `logout should invalidate the auth cookie`() {
        val loginResponse =
            authControllerCalls.login(LoginRequest(username = "chief", password = "secret"))
        val freshCookie = authControllerCalls.extractAuthCookie(loginResponse)

        val logoutResponse = authControllerCalls.logout(freshCookie)

        assertThat(logoutResponse.statusCode).isEqualTo(HttpStatus.NO_CONTENT)

        val setCookieHeader = logoutResponse.headers.getFirst(HttpHeaders.SET_COOKIE)
        assertThat(setCookieHeader).contains("OFSM_AUTH=")
        assertThat(setCookieHeader).contains("Max-Age=0")
    }
}
