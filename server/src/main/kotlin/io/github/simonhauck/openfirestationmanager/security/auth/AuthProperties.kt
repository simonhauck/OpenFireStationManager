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
)

data class RoleProperties(
    /**
     * OFSM role to the provider role names that grant it. When absent, every OFSM role maps to the
     * provider role with the same name.
     */
    val mapping: Map<UserRole, List<String>>? = null,
)
