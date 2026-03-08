package io.github.simonhauck.openfirestationmanager.auth

import org.assertj.core.api.Assertions.assertThat
import io.github.simonhauck.openfirestationmanager.security.AuthenticationProperties
import io.github.simonhauck.openfirestationmanager.user.UserAccount
import io.github.simonhauck.openfirestationmanager.user.UserRole
import kotlin.time.Duration.Companion.seconds
import org.junit.jupiter.api.Test

class JwtTokenUtilityTest {

    @Test
    fun `should generate valid jwt token and parse claims`() {
        val utility = createUtility(secret = "12345678901234567890123456789012")
        val user =
            UserAccount(
                id = 42,
                username = "captain.jane",
                passwordHash = "hashed-password",
                roles = listOf(UserRole.ADMIN, UserRole.USER),
            )

        val token = utility.generateTokenForUser(user, 60.seconds)
        val result = utility.parseToken(token)

        assertThat(result).isInstanceOfSatisfying(ParseTokenResult.Success::class.java) { success ->
            assertThat(success.claims.subject).isEqualTo("42")
            assertThat(success.claims.getStringClaim("username")).isEqualTo("captain.jane")
            assertThat(success.claims.getStringListClaim("roles")).containsExactly("ADMIN", "USER")
        }
    }

    @Test
    fun `should fail parsing when jwt signature is invalid`() {
        val tokenCreator = createUtility(secret = "12345678901234567890123456789012")
        val tokenParser = createUtility(secret = "abcdefghijabcdefghijabcdefghij12")
        val user = UserAccount(id = 7, username = "firefighter", passwordHash = "hash")

        val token = tokenCreator.generateTokenForUser(user, 60.seconds)
        val result = tokenParser.parseToken(token)

        assertThat(result).isInstanceOfSatisfying(ParseTokenResult.Failure::class.java) { failure ->
            assertThat(failure.reason).isEqualTo("Invalid token signature")
        }
    }

    @Test
    fun `should fail parsing when jwt token is expired`() {
        val utility = createUtility(secret = "12345678901234567890123456789012")
        val user = UserAccount(id = 9, username = "expired.user", passwordHash = "hash")

        val token = utility.generateTokenForUser(user, (-1).seconds)
        val result = utility.parseToken(token)

        assertThat(result).isInstanceOfSatisfying(ParseTokenResult.Failure::class.java) { failure ->
            assertThat(failure.reason).isEqualTo("Token has expired")
        }
    }

    @Test
    fun `should fail parsing when jwt token is malformed`() {
        val utility = createUtility(secret = "12345678901234567890123456789012")

        val result = utility.parseToken("not-a-jwt")

        assertThat(result).isInstanceOfSatisfying(ParseTokenResult.Failure::class.java) { failure ->
            assertThat(failure.reason).startsWith("Failed to parse token:")
        }
    }

    private fun createUtility(secret: String): JwtTokenUtility {
        val properties =
            AuthenticationProperties(
                jwtSigningSecret = secret,
                key = "unused",
                tokenValiditySeconds = 3600,
            )
        return JwtTokenUtility(properties).also { it.generateSigner() }
    }
}
