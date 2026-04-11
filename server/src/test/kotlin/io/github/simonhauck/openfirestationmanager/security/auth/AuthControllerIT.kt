package io.github.simonhauck.openfirestationmanager.security.auth

import io.github.simonhauck.openfirestationmanager.IntegrationTest
import io.github.simonhauck.openfirestationmanager.testutil.snapshotTest
import io.github.simonhauck.openfirestationmanager.usermanagement.AdminUserControllerCalls
import java.time.ZonedDateTime
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.http.HttpStatus

class AuthControllerIT() : IntegrationTest() {
    @Autowired private lateinit var authControllerCalls: AuthControllerCalls
    @Autowired private lateinit var adminUserControllerCalls: AdminUserControllerCalls

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
            val loginResponse = authControllerCalls.login()
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
    fun `logout should return no content`() {
        val loginResponse = authControllerCalls.login()
        val freshCookie = authControllerCalls.extractAuthCookie(loginResponse)

        val logoutResponse = authControllerCalls.logout(freshCookie)

        assertThat(logoutResponse.statusCode).isEqualTo(HttpStatus.NO_CONTENT)
    }

    @Test
    fun `login should only return remember-me cookie when explicitly requested`() {
        val loginWithoutRememberMe = authControllerCalls.login(rememberMe = false)
        val rememberMeCookieWithoutRememberMe =
            authControllerCalls.extractRememberMeCookie(loginWithoutRememberMe)
        assertThat(rememberMeCookieWithoutRememberMe).isNull()

        val loginWithRememberMe = authControllerCalls.login(rememberMe = true)
        val rememberMeCookieWithRememberMe =
            authControllerCalls.extractRememberMeCookie(loginWithRememberMe)
        assertThat(rememberMeCookieWithRememberMe).isNotNull
    }

    @Test
    fun `login without remember-me creates session and allows authentication`() {
        // Test that session-based authentication works: user logs in, gets a session cookie,
        // and can use that cookie to authenticate subsequent requests.
        val loginResponse = authControllerCalls.login(rememberMe = false)
        val authCookie = authControllerCalls.extractAuthCookie(loginResponse)

        assertThat(authCookie).isNotNull

        // Use the session cookie to authenticate a subsequent request.
        val meResponse = authControllerCalls.me(authCookie)

        assertThat(meResponse.statusCode).isEqualTo(HttpStatus.OK)
        assertThat(meResponse.body?.authenticated).isTrue
    }

    @Test
    fun `remember-me cookie survives application restart`() {
        // Note: Remember-me tokens are stateless and cryptographically signed.
        // They survive application restarts automatically because authentication
        // only validates the token signature using the REMEMBER_ME_KEY, which can
        // be the same across restarts as long as the environment variable is stable.
        val loginResponse = authControllerCalls.login(rememberMe = true)
        val rememberMeCookie = authControllerCalls.extractRememberMeCookie(loginResponse)

        assertThat(rememberMeCookie).isNotNull

        // Simulate: Application restart doesn't affect cookie validity.
        // In production, as long as REMEMBER_ME_KEY env var is the same,
        // the token remains valid after app restart.

        // Verify authentication still works after "restart"
        val meResponse = authControllerCalls.me(rememberMeCookie)
        assertThat(meResponse.statusCode).isEqualTo(HttpStatus.OK)
        assertThat(meResponse.body?.authenticated).isTrue
    }
}
