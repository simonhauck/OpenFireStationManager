package io.github.simonhauck.openfirestationmanager.auth

import com.nimbusds.jose.JWSAlgorithm
import com.nimbusds.jose.JWSHeader
import com.nimbusds.jose.JWSSigner
import com.nimbusds.jose.JWSVerifier
import com.nimbusds.jose.crypto.MACSigner
import com.nimbusds.jose.crypto.MACVerifier
import com.nimbusds.jwt.JWTClaimsSet
import com.nimbusds.jwt.SignedJWT
import io.github.simonhauck.openfirestationmanager.security.AuthenticationProperties
import io.github.simonhauck.openfirestationmanager.user.UserAccount
import jakarta.annotation.PostConstruct
import java.util.Date
import kotlin.time.Duration
import org.springframework.stereotype.Component

@Component
class JwtTokenUtility(private val authenticationProperties: AuthenticationProperties) {

    private lateinit var signer: JWSSigner
    private lateinit var jwsVerifier: JWSVerifier

    @PostConstruct
    fun generateSigner() {
        signer = MACSigner(authenticationProperties.jwtSigningSecret)
        jwsVerifier = MACVerifier(authenticationProperties.jwtSigningSecret)
    }

    fun generateTokenForUser(userAccount: UserAccount, tokenValidity: Duration): String {
        val claimsSet =
            JWTClaimsSet.Builder()
                .subject(userAccount.username)
                .claim("roles", userAccount.roles.map { it.name })
                .issuer(authenticationProperties.cookieName)
                .expirationTime(
                    Date(System.currentTimeMillis() + tokenValidity.inWholeMilliseconds)
                )
                .build()

        val signed =
            SignedJWT(JWSHeader.Builder(JWSAlgorithm.HS256).build(), claimsSet).apply {
                sign(signer)
            }

        return signed.serialize()
    }

    fun parseToken(token: String): ParseTokenResult {
        val signed =
            runCatching { SignedJWT.parse(token) }
                .getOrElse {
                    return ParseTokenResult.Failure("Failed to parse token: ${it.message}")
                }

        if (!signed.verify(jwsVerifier)) {
            return ParseTokenResult.Failure("Invalid token signature")
        }

        val claims =
            runCatching { signed.jwtClaimsSet }
                .getOrElse {
                    return ParseTokenResult.Failure("Failed to parse token: ${it.message}")
                }

        if (claims.expirationTime.before(Date())) {
            return ParseTokenResult.Failure("Token has expired")
        }

        return ParseTokenResult.Success(
            userName = claims.subject,
            roles = claims.getStringListClaim("roles"),
        )
    }
}

sealed interface ParseTokenResult {
    data class Success(val userName: String, val roles: List<String>) : ParseTokenResult

    data class Failure(val reason: String) : ParseTokenResult
}
