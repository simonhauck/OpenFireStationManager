package io.github.simonhauck.openfirestationmanager.security.auth

import io.github.simonhauck.openfirestationmanager.usermanagement.UserRole
import org.springframework.boot.context.properties.ConfigurationProperties

/** How OFSM reads identity and roles from the OpenID Connect provider's claims. */
@ConfigurationProperties("app.auth")
data class AuthProperties(
    /**
     * Claim whose value becomes the username (shown in the UI and written to audit fields). Falls
     * back to `sub` when the claim is missing.
     */
    val usernameClaim: String = "preferred_username",
    val roles: RoleProperties = RoleProperties(),
    val mcp: McpAuthProperties = McpAuthProperties(),
)

/** Bearer token rules of the MCP endpoint (`/mcp`), which is an OAuth2 resource server. */
data class McpAuthProperties(
    /**
     * Audiences OFSM accepts in the `aud` claim of an access token. A token whose `aud` contains
     * none of them was issued for another application and is rejected. Must not be empty.
     */
    val acceptedAudiences: List<String> = listOf(DEFAULT_AUDIENCE),
) {
    init {
        require(acceptedAudiences.any { it.isNotBlank() }) {
            "app.auth.mcp.accepted-audiences must contain at least one audience " +
                "(default: $DEFAULT_AUDIENCE)"
        }
    }

    companion object {
        const val DEFAULT_AUDIENCE = "ofsm"
    }
}

/**
 * Where provider roles are found and how they translate to OFSM roles. Invalid values fail
 * application startup with a message naming the offending property.
 */
data class RoleProperties(
    /**
     * Claims that carry provider roles, as dot-separated paths into the claim set (for example
     * `realm_access.roles`, `resource_access.ofsm.roles` or `groups`). The results are unioned.
     * Must not be empty.
     */
    val claimPaths: List<String> = RoleMapper.DEFAULT_CLAIM_PATHS,
    /**
     * OFSM role name to the provider role names that grant it. Keys must be OFSM roles (matched
     * case-insensitively, because environment variables lose their case). When absent, every OFSM
     * role maps to the provider role with the same name; when present, it is authoritative.
     */
    val mapping: Map<String, List<String>>? = null,
) {

    /** [mapping] with its keys resolved to [UserRole], or null when no mapping is configured. */
    val ofsmMapping: Map<UserRole, List<String>>?

    init {
        require(claimPaths.isNotEmpty()) {
            "app.auth.roles.claim-paths must contain at least one claim path " +
                "(default: ${RoleMapper.DEFAULT_CLAIM_PATHS})"
        }
        claimPaths.forEach { path ->
            require(path.split(RoleMapper.PATH_SEPARATOR).none { it.isBlank() }) {
                "app.auth.roles.claim-paths contains the invalid claim path '$path'; " +
                    "use dot-separated claim names such as 'realm_access.roles'"
            }
        }
        ofsmMapping = mapping?.mapKeys { (key, _) ->
            UserRole.entries.firstOrNull { it.name.equals(key, ignoreCase = true) }
                ?: throw IllegalArgumentException(
                    "app.auth.roles.mapping contains the unknown OFSM role '$key'; " +
                        "valid keys are ${UserRole.entries.joinToString { it.name }}",
                )
        }
    }
}
