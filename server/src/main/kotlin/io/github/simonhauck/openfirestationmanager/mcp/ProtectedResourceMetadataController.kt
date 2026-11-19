package io.github.simonhauck.openfirestationmanager.mcp

import io.swagger.v3.oas.annotations.Hidden
import jakarta.servlet.http.HttpServletRequest
import org.springframework.beans.factory.annotation.Value
import org.springframework.http.MediaType
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RestController

/**
 * OAuth 2.0 Protected Resource Metadata (RFC 9728) of the MCP endpoint. It names the OpenID Connect
 * provider as the authorization server, so an MCP client can register itself there and sign the
 * user in. Published at the path-inserted location for `/mcp` and, for clients that only try the
 * root location, at the well-known prefix itself.
 *
 * Not part of the REST API, so it is hidden from the OpenAPI contract.
 */
@Hidden
@RestController
class ProtectedResourceMetadataController(
    @param:Value("\${spring.security.oauth2.client.provider.ofsm.issuer-uri}")
    private val issuerUri: String,
) {

    @GetMapping(
        McpPaths.METADATA,
        McpPaths.METADATA + McpPaths.ENDPOINT,
        produces = [MediaType.APPLICATION_JSON_VALUE],
    )
    fun metadata(request: HttpServletRequest): Map<String, Any> =
        mapOf(
            "resource" to McpPaths.resourceUrl(request),
            "authorization_servers" to listOf(issuerUri),
            "bearer_methods_supported" to listOf("header"),
            "resource_name" to RESOURCE_NAME,
        )

    companion object {
        const val RESOURCE_NAME = "OpenFireStationManager"
    }
}
