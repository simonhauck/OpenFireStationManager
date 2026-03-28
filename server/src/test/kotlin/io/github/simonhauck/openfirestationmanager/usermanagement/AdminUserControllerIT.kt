package io.github.simonhauck.openfirestationmanager.usermanagement

import io.github.simonhauck.openfirestationmanager.IntegrationTest
import io.github.simonhauck.openfirestationmanager.testutil.snapshotTest
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
    fun `createUser should return 400 when username is blank`() =
        snapshotTest(this) {
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
            response.body.shouldEqualSnapshot("expected_failed_create_user_response.json")
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
    fun `getUserById should return one user when authenticated as admin`() {
        val createdUser =
            adminUserControllerCalls
                .createUser(
                    CreateUserRequest(
                        username = uniqueUsername(),
                        password = "password",
                        firstName = "Alex",
                        lastName = "Miller",
                        roles = listOf(UserRole.USER),
                    ),
                    authCookie = validCookieHeader,
                )
                .body!!

        val response =
            adminUserControllerCalls.getUserById(
                id = createdUser.id,
                authCookie = validCookieHeader,
            )

        assertThat(response.statusCode).isEqualTo(HttpStatus.OK)
        assertThat(response.body).isNotNull
        assertThat(response.body?.id).isEqualTo(createdUser.id)
        assertThat(response.body?.username).isEqualTo(createdUser.username)
        assertThat(response.body?.firstName).isEqualTo("Alex")
        assertThat(response.body?.lastName).isEqualTo("Miller")
        assertThat(response.body?.roles).containsExactly(UserRole.USER)
    }

    @Test
    fun `getUserById should return 404 when user does not exist`() {
        val response =
            adminUserControllerCalls.getUserByIdExpectingError(
                id = Long.MAX_VALUE,
                authCookie = validCookieHeader,
            )

        assertThat(response.statusCode).isEqualTo(HttpStatus.NOT_FOUND)
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

    @Test
    fun `changePassword should update the password when authenticated as admin`() {
        val createdUser =
            adminUserControllerCalls
                .createUser(
                    CreateUserRequest(
                        username = uniqueUsername(),
                        password = "oldPassword",
                        firstName = "Test",
                        lastName = "User",
                        roles = listOf(UserRole.USER),
                    ),
                    authCookie = validCookieHeader,
                )
                .body!!

        val response =
            adminUserControllerCalls.changePassword(
                id = createdUser.id,
                request = ChangePasswordRequest(newPassword = "newPassword"),
                authCookie = validCookieHeader,
            )

        assertThat(response.statusCode).isEqualTo(HttpStatus.OK)
        assertThat(response.body?.id).isEqualTo(createdUser.id)
    }

    @Test
    fun `changePassword should return 404 when user does not exist`() {
        val response =
            adminUserControllerCalls.changePasswordExpectingError(
                id = Long.MAX_VALUE,
                request = ChangePasswordRequest(newPassword = "newPassword"),
                authCookie = validCookieHeader,
            )

        assertThat(response.statusCode).isEqualTo(HttpStatus.NOT_FOUND)
    }

    private fun uniqueUsername() = "user-${UUID.randomUUID()}"
}
