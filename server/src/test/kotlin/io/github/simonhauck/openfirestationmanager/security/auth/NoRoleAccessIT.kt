package io.github.simonhauck.openfirestationmanager.security.auth

import io.github.simonhauck.openfirestationmanager.IntegrationTest
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.http.HttpStatus

/** A signed-in user without any OFSM role is authenticated but may not use the API. */
class NoRoleAccessIT : IntegrationTest() {
    @Autowired private lateinit var authControllerCalls: AuthControllerCalls

    @Test
    fun `should return 403 on a protected endpoint for a session without roles`() {
        val response = authControllerCalls.protectedEndpoint(cookieWithRoles())

        assertThat(response.statusCode).isEqualTo(HttpStatus.FORBIDDEN)
    }

    @Test
    fun `should report authenticated with empty roles for a session without roles`() {
        val response = authControllerCalls.me(cookieWithRoles())

        assertThat(response.statusCode).isEqualTo(HttpStatus.OK)
        assertThat(response.body?.authenticated).isTrue
        assertThat(response.body?.user?.roles).isEmpty()
    }
}
