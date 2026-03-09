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
                firstName = "Jane",
                lastName = "Doe",
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
                firstName = "John",
                lastName = "Smith",
                roles = listOf(UserRole.USER),
            )

        val response = adminUserControllerCalls.createUser(request, authCookie = validCookieHeader)

        assertThat(response.statusCode).isEqualTo(HttpStatus.OK)
        assertThat(response.body?.username).isEqualTo(username)
        assertThat(response.body?.firstName).isEqualTo("John")
        assertThat(response.body?.lastName).isEqualTo("Smith")
        assertThat(response.body?.roles).containsExactly(UserRole.USER)
    }

    @Test
    fun `createUser should return 400 when username is blank`() {
        val request =
            CreateUserRequest(
                username = "",
                password = "password",
                firstName = "John",
                lastName = "Smith",
                roles = listOf(UserRole.USER),
            )

        val response =
            adminUserControllerCalls.createUserExpectingError(
                request,
                authCookie = validCookieHeader,
            )

        assertThat(response.statusCode).isEqualTo(HttpStatus.BAD_REQUEST)
    }

    @Test
    fun `getAllUsers should return 403 when no auth cookie is provided`() {
        val response = adminUserControllerCalls.getAllUsersExpectingError(authCookie = null)

        assertThat(response.statusCode).isEqualTo(HttpStatus.FORBIDDEN)
    }

    @Test
    fun `getAllUsers should return created user when authenticated as admin`() {
        val response = adminUserControllerCalls.getAllUsers(authCookie = validCookieHeader)

        assertThat(response.statusCode).isEqualTo(HttpStatus.OK)
        assertThat(response.body).extracting<String> { it.username }.contains("chief")
    }

    @Test
    fun `updateUser should update first and last name and roles for one user`() {
        val createdUser =
            adminUserControllerCalls
                .createUser(
                    CreateUserRequest(
                        username = uniqueUsername(),
                        password = "password",
                        firstName = "User",
                        lastName = "One",
                        roles = listOf(UserRole.USER),
                    ),
                    authCookie = validCookieHeader,
                )
                .body!!

        val response =
            adminUserControllerCalls.updateUser(
                id = createdUser.id,
                request =
                    UpdateUserRequest(
                        firstName = "Jamie",
                        lastName = "Taylor",
                        roles = listOf(UserRole.ADMIN),
                    ),
                authCookie = validCookieHeader,
            )

        assertThat(response.statusCode).isEqualTo(HttpStatus.OK)
        assertThat(response.body).isNotNull
        assertThat(response.body?.id).isEqualTo(createdUser.id)
        assertThat(response.body?.firstName).isEqualTo("Jamie")
        assertThat(response.body?.lastName).isEqualTo("Taylor")
        assertThat(response.body?.roles).containsExactly(UserRole.ADMIN)
    }

    @Test
    fun `updateUser should return 404 when user does not exist`() {
        val response =
            adminUserControllerCalls.updateUserExpectingError(
                id = Long.MAX_VALUE,
                request =
                    UpdateUserRequest(
                        firstName = "Ghost",
                        lastName = "User",
                        roles = listOf(UserRole.USER),
                    ),
                authCookie = validCookieHeader,
            )

        assertThat(response.statusCode).isEqualTo(HttpStatus.NOT_FOUND)
    }

    private fun uniqueUsername() = "user-${UUID.randomUUID()}"
}
