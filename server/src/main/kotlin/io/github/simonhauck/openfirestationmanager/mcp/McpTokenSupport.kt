package io.github.simonhauck.openfirestationmanager.mcp

import io.github.simonhauck.openfirestationmanager.security.auth.AuthProperties
import io.github.simonhauck.openfirestationmanager.security.auth.OfsmUserFactory
import io.github.simonhauck.openfirestationmanager.security.auth.RoleMapper
import org.springframework.core.convert.converter.Converter
import org.springframework.security.authentication.AbstractAuthenticationToken
import org.springframework.security.core.authority.SimpleGrantedAuthority
import org.springframework.security.oauth2.core.OAuth2Error
import org.springframework.security.oauth2.core.OAuth2ErrorCodes
import org.springframework.security.oauth2.core.OAuth2TokenValidator
import org.springframework.security.oauth2.core.OAuth2TokenValidatorResult
import org.springframework.security.oauth2.jwt.Jwt
import org.springframework.security.oauth2.server.resource.InvalidBearerTokenException
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken

/**
 * Rejects access tokens that were not issued for OFSM: the `aud` claim must contain at least one of
 * [acceptedAudiences] (`app.auth.mcp.accepted-audiences`).
 */
class McpAudienceValidator(private val acceptedAudiences: Collection<String>) :
    OAuth2TokenValidator<Jwt> {

    override fun validate(token: Jwt): OAuth2TokenValidatorResult {
        val audiences: List<String> = token.audience.orEmpty()
        if (audiences.any { it in acceptedAudiences }) return OAuth2TokenValidatorResult.success()

        return OAuth2TokenValidatorResult.failure(
            OAuth2Error(
                OAuth2ErrorCodes.INVALID_TOKEN,
                "The token was not issued for this resource (audience mismatch)",
                null,
            ),
        )
    }
}

/**
 * Turns a validated access token into the authentication of an MCP request. Roles come from the
 * token's claims through the same [RoleMapper] rules as the browser login, so `ROLE_<NAME>`
 * authorities, `ADMIN` expansion and `CurrentUserProvider` behave identically. The name is the
 * configured username claim, falling back to `sub`.
 */
class McpJwtAuthenticationConverter(private val authProperties: AuthProperties) :
    Converter<Jwt, AbstractAuthenticationToken> {

    private val roleMapper =
        RoleMapper(authProperties.roles.claimPaths, authProperties.roles.ofsmMapping)

    override fun convert(source: Jwt): AbstractAuthenticationToken {
        val authorities =
            roleMapper.map(source.claims).map {
                SimpleGrantedAuthority("${OfsmUserFactory.ROLE_PREFIX}${it.name}")
            }
        val name =
            source.getClaimAsString(authProperties.usernameClaim)
                ?: source.subject
                ?: throw InvalidBearerTokenException("The access token has no subject")
        return JwtAuthenticationToken(source, authorities, name)
    }
}
