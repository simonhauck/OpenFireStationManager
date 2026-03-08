package io.github.simonhauck.openfirestationmanager.auth

import io.github.simonhauck.openfirestationmanager.IntegrationTest
import io.github.simonhauck.openfirestationmanager.user.CreateUserRequest
import io.github.simonhauck.openfirestationmanager.user.UserService
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
        val user =
            userService.createUser(
                CreateUserRequest(username = "auth.user", password = "secure1234")
            )

        val now = System.currentTimeMillis()
        val result =
            authService.login(
                LoginRequest(
                    username = "auth.user",
                    password = "secure1234",
                    tokenValiditySeconds = 120,
                )
            )

        assertThat(result.token).isNotBlank()
        assertThat(jwtTokenUtility.parseToken(result.token)).isInstanceOfSatisfying(
            ParseTokenResult.Success::class.java
        ) { success ->
            assertThat(success.claims.subject).isEqualTo(user.id.toString())
            assertThat(success.claims.getStringClaim("username")).isEqualTo("auth.user")
            assertThat(success.claims.getStringListClaim("roles")).isEmpty()
            assertThat(success.claims.expirationTime.time).isBetween(now + 110_000, now + 130_000)
        }
    }

    @Test
    fun `should fail login when password is invalid`() {
        userService.createUser(CreateUserRequest(username = "auth.user", password = "secure1234"))

        assertThatThrownBy {
                authService.login(
                    LoginRequest(
                        username = "auth.user",
                        password = "wrong-password",
                        tokenValiditySeconds = 120,
                    )
                )
            }
            .isInstanceOf(BadCredentialsException::class.java)
    }
}
