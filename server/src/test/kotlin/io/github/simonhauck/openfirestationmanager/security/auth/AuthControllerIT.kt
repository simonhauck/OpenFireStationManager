package io.github.simonhauck.openfirestationmanager.security.auth

import io.github.simonhauck.openfirestationmanager.IntegrationTest
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.http.HttpStatus

/**
 * Session behaviour that does not need the provider. The OpenID Connect login and logout flow is
 * covered by [OidcLoginIT].
 */
class AuthControllerIT : IntegrationTest() {
    @Autowired private lateinit var authControllerCalls: AuthControllerCalls

    @Test
    fun `should return authenticated false when user does not provide a cookie`() {
        val response = authControllerCalls.me(null)

        assertThat(response.statusCode).isEqualTo(HttpStatus.OK)
        assertThat(response.body?.authenticated).isFalse
        assertThat(response.body?.user).isNull()
    }

    @Test
    fun `protected endpoints return 401 without a session`() {
        val response = authControllerCalls.protectedEndpoint(null)

        assertThat(response.statusCode).isEqualTo(HttpStatus.UNAUTHORIZED)
    }
}
