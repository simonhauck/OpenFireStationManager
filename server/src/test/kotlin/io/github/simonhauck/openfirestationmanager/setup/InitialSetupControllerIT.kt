package io.github.simonhauck.openfirestationmanager.setup

import io.github.simonhauck.openfirestationmanager.IntegrationTest
import io.github.simonhauck.openfirestationmanager.security.auth.LocalAdminFixture
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.http.HttpStatus

class InitialSetupControllerIT : IntegrationTest() {

    @Autowired private lateinit var initialSetupControllerCalls: InitialSetupControllerCalls
    @Autowired private lateinit var localAdminFixture: LocalAdminFixture

    @BeforeEach
    fun createLocalAdmin() {
        localAdminFixture.ensureLocalAdmin()
    }

    @Test
    fun `initial admin creation should fail when a user already exists`() {
        val request =
            InitialAdminSetupRequest(
                username = "chief",
                password = "secret",
                firstName = "Initial",
                lastName = "Admin",
            )

        val secondResponse = initialSetupControllerCalls.createInitialAdminExpectingProblem(request)

        assertThat(secondResponse.statusCode).isEqualTo(HttpStatus.CONFLICT)
        assertThat(secondResponse.body?.detail).isEqualTo("Initial admin is already configured")
    }
}
