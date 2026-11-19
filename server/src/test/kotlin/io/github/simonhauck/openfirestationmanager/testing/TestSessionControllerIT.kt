package io.github.simonhauck.openfirestationmanager.testing

import io.github.simonhauck.openfirestationmanager.IntegrationTest
import io.github.simonhauck.openfirestationmanager.security.auth.AuthControllerCalls
import io.github.simonhauck.openfirestationmanager.usermanagement.UserRole
import java.util.UUID
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.http.HttpStatus

class TestSessionControllerIT : IntegrationTest() {

    @Autowired private lateinit var testSessionControllerCalls: TestSessionControllerCalls
    @Autowired private lateinit var authControllerCalls: AuthControllerCalls

    @Test
    fun `createSession should return a cookie that authenticates without a user row`() {
        val username = "session-user-${UUID.randomUUID()}"

        val sessionResponse =
            testSessionControllerCalls.createSession(
                TestSessionRequest(
                    username = username,
                    firstName = "Session",
                    lastName = "Tester",
                    roles = listOf(UserRole.KLEIDERWART),
                ),
            )
        val authCookie = testSessionControllerCalls.extractAuthCookie(sessionResponse)

        assertThat(sessionResponse.statusCode).isEqualTo(HttpStatus.NO_CONTENT)
        assertThat(authCookie).isNotNull

        val meResponse = authControllerCalls.me(authCookie)

        assertThat(meResponse.statusCode).isEqualTo(HttpStatus.OK)
        assertThat(meResponse.body?.authenticated).isTrue
        assertThat(meResponse.body?.user?.username).isEqualTo(username)
        assertThat(meResponse.body?.user?.firstName).isEqualTo("Session")
        assertThat(meResponse.body?.user?.lastName).isEqualTo("Tester")
        assertThat(meResponse.body?.user?.roles).containsExactly(UserRole.KLEIDERWART)
    }
}
