package io.github.simonhauck.openfirestationmanager.security.shared

import com.nimbusds.jwt.SignedJWT
import io.github.simonhauck.openfirestationmanager.security.config.AuthenticationProperties
import kotlin.test.Test
import kotlin.time.Duration.Companion.minutes
import kotlin.time.Duration.Companion.seconds
import org.assertj.core.api.Assertions.assertThat

class JwtTokenUtilityTest {

    private val authenticationProperties =
        AuthenticationProperties(
            jwtSigningSecret = "01234567890123456789012345678901",
            cookieName = "open-fire-station-manager",
        )

    private val tokenUtility = JwtTokenUtility(authenticationProperties).apply { generateSigner() }

    @Test
    fun `should generate token with expected claims and parse it successfully`() {
        val token = tokenUtility.generateToken("alice", listOf("USER", "ADMIN"), 5.minutes)

        val signedToken = SignedJWT.parse(token)
        val claims = signedToken.jwtClaimsSet
        val parseResult = tokenUtility.parseToken(token)

        assertThat(claims.subject).isEqualTo("alice")
        assertThat(claims.getStringListClaim("roles")).containsExactly("USER", "ADMIN")
        assertThat(claims.issuer).isEqualTo("open-fire-station-manager")
        assertThat(claims.expirationTime).isAfter(java.util.Date())

        assertThat(parseResult)
            .isEqualTo(
                ParseTokenResult.Success(userName = "alice", roles = listOf("USER", "ADMIN"))
            )
    }

    @Test
    fun `should return failure when token is malformed`() {
        val parseResult = tokenUtility.parseToken("not-a-jwt-token")

        assertThat(parseResult).isInstanceOf(ParseTokenResult.Failure::class.java)
        assertThat((parseResult as ParseTokenResult.Failure).reason)
            .startsWith("Failed to parse token:")
    }

    @Test
    fun `should return failure when token signature is invalid`() {
        val otherTokenUtility =
            JwtTokenUtility(
                    AuthenticationProperties(
                        jwtSigningSecret = "abcdefghijklmnopqrstuvwxyz123456",
                        cookieName = "open-fire-station-manager",
                    )
                )
                .apply { generateSigner() }

        val token = otherTokenUtility.generateToken("alice", emptyList(), 5.minutes)

        val parseResult = tokenUtility.parseToken(token)

        assertThat(parseResult).isEqualTo(ParseTokenResult.Failure("Invalid token signature"))
    }

    @Test
    fun `should return failure when token has expired`() {
        val expiredToken = tokenUtility.generateToken("alive", emptyList(), (-10).seconds)

        val parseResult = tokenUtility.parseToken(expiredToken)

        assertThat(parseResult).isEqualTo(ParseTokenResult.Failure("Token has expired"))
    }
}
