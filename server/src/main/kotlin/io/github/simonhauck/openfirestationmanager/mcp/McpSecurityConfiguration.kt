package io.github.simonhauck.openfirestationmanager.mcp

import io.github.simonhauck.openfirestationmanager.security.auth.AuthProperties
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.springframework.beans.factory.annotation.Value
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.core.annotation.Order
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpStatus
import org.springframework.security.config.annotation.web.builders.HttpSecurity
import org.springframework.security.config.http.SessionCreationPolicy
import org.springframework.security.core.AuthenticationException
import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator
import org.springframework.security.oauth2.core.OAuth2AuthenticationException
import org.springframework.security.oauth2.jwt.JwtDecoder
import org.springframework.security.oauth2.jwt.JwtDecoders
import org.springframework.security.oauth2.jwt.JwtValidators
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder
import org.springframework.security.oauth2.jwt.SupplierJwtDecoder
import org.springframework.security.web.AuthenticationEntryPoint
import org.springframework.security.web.SecurityFilterChain
import org.springframework.web.servlet.support.ServletUriComponentsBuilder

/** Paths and URLs of the MCP endpoint and its OAuth 2.0 protected-resource metadata. */
object McpPaths {
    const val ENDPOINT = "/mcp"

    /** RFC 9728 well-known prefix; the metadata of `/mcp` lives at this prefix plus `/mcp`. */
    const val METADATA = "/.well-known/oauth-protected-resource"

    const val METADATA_CHAIN_ORDER = 2
    const val ENDPOINT_CHAIN_ORDER = 3

    /** The resource identifier of the MCP endpoint, e.g. `https://ofsm.example.org/mcp`. */
    fun resourceUrl(request: HttpServletRequest): String = baseUrl(request) + ENDPOINT

    /** Where the metadata of [resourceUrl] is published (RFC 9728 path insertion). */
    fun metadataUrl(request: HttpServletRequest): String = baseUrl(request) + METADATA + ENDPOINT

    /** Public base URL; honours `X-Forwarded-*` through `server.forward-headers-strategy`. */
    private fun baseUrl(request: HttpServletRequest): String =
        ServletUriComponentsBuilder.fromContextPath(request).build().toUriString().trimEnd('/')
}

/**
 * Security for the MCP endpoint, separate from the cookie-based browser chain in
 * `SecurityConfiguration`.
 *
 * `/mcp` is a stateless OAuth2 resource server: it accepts only `Authorization: Bearer` access
 * tokens (JWT) from the configured OpenID Connect provider whose `aud` contains one of
 * `app.auth.mcp.accepted-audiences`, never reads or creates a session and never sets a cookie.
 * Unauthenticated requests get `401` with a `WWW-Authenticate` header pointing at the
 * protected-resource metadata, which is how MCP clients discover the provider and start the browser
 * login (MCP authorization spec).
 */
@Configuration
class McpSecurityConfiguration(
    private val authProperties: AuthProperties,
    @param:Value("\${spring.security.oauth2.client.provider.ofsm.issuer-uri}")
    private val issuerUri: String,
) {

    /** The metadata is public and must not create a session either. */
    @Bean
    @Order(McpPaths.METADATA_CHAIN_ORDER)
    fun mcpMetadataSecurityFilterChain(http: HttpSecurity): SecurityFilterChain =
        http
            .securityMatcher(McpPaths.METADATA, "${McpPaths.METADATA}/**")
            .csrf { it.disable() }
            .sessionManagement { it.sessionCreationPolicy(SessionCreationPolicy.STATELESS) }
            .requestCache { it.disable() }
            .logout { it.disable() }
            .authorizeHttpRequests { it.anyRequest().permitAll() }
            .build()

    @Bean
    @Order(McpPaths.ENDPOINT_CHAIN_ORDER)
    fun mcpSecurityFilterChain(http: HttpSecurity): SecurityFilterChain {
        val entryPoint = McpAuthenticationEntryPoint()
        return http
            .securityMatcher(McpPaths.ENDPOINT, "${McpPaths.ENDPOINT}/**")
            .csrf { it.disable() }
            .sessionManagement { it.sessionCreationPolicy(SessionCreationPolicy.STATELESS) }
            .requestCache { it.disable() }
            .logout { it.disable() }
            .oauth2ResourceServer {
                it.authenticationEntryPoint(entryPoint)
                it.jwt { jwt ->
                    jwt.decoder(mcpJwtDecoder())
                    jwt.jwtAuthenticationConverter(McpJwtAuthenticationConverter(authProperties))
                }
            }
            .exceptionHandling { it.authenticationEntryPoint(entryPoint) }
            // Signing in is enough for the transport; every tool checks the OFSM roles of the
            // matching REST endpoint itself.
            .authorizeHttpRequests { it.anyRequest().authenticated() }
            .build()
    }

    /**
     * Validates signature (keys from the provider's JWKS), expiry, issuer and audience. The
     * provider metadata is fetched on first use, so this adds no startup dependency beyond the one
     * the browser login already has.
     */
    private fun mcpJwtDecoder(): JwtDecoder = SupplierJwtDecoder {
        val decoder = JwtDecoders.fromIssuerLocation<NimbusJwtDecoder>(issuerUri)
        decoder.setJwtValidator(
            DelegatingOAuth2TokenValidator(
                JwtValidators.createDefaultWithIssuer(issuerUri),
                McpAudienceValidator(authProperties.mcp.acceptedAudiences),
            ),
        )
        decoder
    }
}

/**
 * Answers every unauthenticated or rejected MCP request with `401` and
 * `WWW-Authenticate: Bearer resource_metadata="…"` (RFC 9728), adding `error` and
 * `error_description` when a token was presented but rejected (RFC 6750).
 */
class McpAuthenticationEntryPoint : AuthenticationEntryPoint {

    override fun commence(
        request: HttpServletRequest,
        response: HttpServletResponse,
        authException: AuthenticationException,
    ) {
        val parameters = linkedMapOf("resource_metadata" to McpPaths.metadataUrl(request))
        val error = (authException as? OAuth2AuthenticationException)?.error
        if (error != null) {
            parameters["error"] = error.errorCode
            error.description?.let { parameters["error_description"] = it }
        }
        val challenge =
            parameters.entries.joinToString(", ", prefix = "Bearer ") { (name, value) ->
                "$name=\"${value.replace("\\", "").replace("\"", "'")}\""
            }
        response.setHeader(HttpHeaders.WWW_AUTHENTICATE, challenge)
        response.status = HttpStatus.UNAUTHORIZED.value()
    }
}
