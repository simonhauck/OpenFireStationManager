package io.github.simonhauck.openfirestationmanager.user

import io.github.simonhauck.openfirestationmanager.IntegrationTest
import java.util.UUID
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.http.HttpStatus

class AdminUserControllerIT : IntegrationTest() {

    @Autowired private lateinit var adminUserControllerCalls: AdminUserControllerCalls

    @Test
    fun `createUser should return 403 when no auth cookie is provided`() {
        val request =
            CreateUserRequest(
                username = uniqueUsername(),
                password = "password",
                roles = listOf(UserRole.USER),
            )

        val response = adminUserControllerCalls.createUserExpectingError(request, authCookie = null)

        assertThat(response.statusCode).isEqualTo(HttpStatus.FORBIDDEN)
    }

    @Test
    fun `createUser should create a new user when authenticated as admin`() {
        val username = uniqueUsername()
        val request =
            CreateUserRequest(
                username = username,
                password = "password",
                roles = listOf(UserRole.USER),
            )

        val response = adminUserControllerCalls.createUser(request, authCookie = validCookieHeader)

        assertThat(response.statusCode).isEqualTo(HttpStatus.OK)
        assertThat(response.body?.username).isEqualTo(username)
        assertThat(response.body?.roles).containsExactly(UserRole.USER)
    }

    @Test
    fun `createUser should return 400 when username is blank`() {
        val request =
            CreateUserRequest(
                username = "",
                password = "password",
                roles = listOf(UserRole.USER),
            )

        val response =
            adminUserControllerCalls.createUserExpectingError(
                request,
                authCookie = validCookieHeader,
            )

        assertThat(response.statusCode).isEqualTo(HttpStatus.BAD_REQUEST)
    }

    private fun uniqueUsername() = "user-${UUID.randomUUID()}"
}
