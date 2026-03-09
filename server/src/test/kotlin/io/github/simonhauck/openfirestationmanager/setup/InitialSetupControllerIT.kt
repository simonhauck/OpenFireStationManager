package io.github.simonhauck.openfirestationmanager.setup

import io.github.simonhauck.openfirestationmanager.IntegrationTest
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.http.HttpStatus

class InitialSetupControllerIT : IntegrationTest() {

    @Autowired private lateinit var initialSetupControllerCalls: InitialSetupControllerCalls

    @Test
    fun `second invocation of admin user creation should fail - first invocation happens in test setup`() {
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
