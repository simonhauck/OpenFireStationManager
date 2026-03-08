package io.github.simonhauck.openfirestationmanager.auth

import io.github.simonhauck.openfirestationmanager.IntegrationTest
import io.github.simonhauck.openfirestationmanager.user.CreateUserRequest
import io.github.simonhauck.openfirestationmanager.user.UserService
import java.util.UUID
import org.assertj.core.api.Assertions.assertThat
import org.assertj.core.api.Assertions.assertThatThrownBy
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.security.authentication.BadCredentialsException

class AuthServiceIT : IntegrationTest() {
    @Autowired private lateinit var authService: AuthService

    @Autowired private lateinit var userService: UserService

    @Autowired private lateinit var jwtTokenUtility: JwtTokenUtility

    @Test
    fun `should generate signed jwt token for valid login request`() {
        val username = "auth.user.${UUID.randomUUID()}"
        val password = "secure1234"

        val user =
            userService.createUser(
                CreateUserRequest(username = username, password = password)
            )

        val now = System.currentTimeMillis()
        val result =
            authService.login(
                LoginRequest(
                    username = username,
                    password = password,
                    tokenValiditySeconds = 120,
                )
            )

        assertThat(result.token).isNotBlank()
        assertThat(jwtTokenUtility.parseToken(result.token)).isInstanceOfSatisfying(
            ParseTokenResult.Success::class.java
        ) { success ->
            assertThat(success.claims.subject).isEqualTo(user.id.toString())
            assertThat(success.claims.getStringClaim("username")).isEqualTo(username)
            assertThat(success.claims.getStringListClaim("roles")).isEmpty()
            assertThat(success.claims.expirationTime.time).isBetween(now + 110_000, now + 130_000)
        }
    }

    @Test
    fun `should fail login when password is invalid`() {
        val username = "auth.user.${UUID.randomUUID()}"
        userService.createUser(CreateUserRequest(username = username, password = "secure1234"))

        assertThatThrownBy {
                authService.login(
                    LoginRequest(
                        username = username,
                        password = "wrong-password",
                        tokenValiditySeconds = 120,
                    )
                )
            }
            .isInstanceOf(BadCredentialsException::class.java)
    }
}
