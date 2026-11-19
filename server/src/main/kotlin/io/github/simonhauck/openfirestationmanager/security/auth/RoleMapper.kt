package io.github.simonhauck.openfirestationmanager.security.auth

import io.github.simonhauck.openfirestationmanager.usermanagement.UserRole

/**
 * Derives the effective OFSM roles from a provider's claims. Framework-free, so the browser login
 * and future token-based paths share exactly the same rules.
 *
 * Provider roles are read from the `realm_access.roles` claim (Keycloak realm roles). [mapping]
 * lists, per OFSM role, the provider role names that grant it; without a mapping every OFSM role
 * maps to the provider role of the same name. A user holding `ADMIN` receives every OFSM role.
 */
class RoleMapper(private val mapping: Map<UserRole, List<String>>? = null) {

    fun map(claims: Map<String, Any?>): Set<UserRole> {
        val providerRoles = providerRolesOf(claims)
        val granted =
            UserRole.entries.filter { role ->
                providerNamesFor(role).any { it in providerRoles }
            }
        return expand(granted)
    }

    private fun providerNamesFor(role: UserRole): List<String> =
        if (mapping == null) listOf(role.name) else mapping[role].orEmpty()

    private fun providerRolesOf(claims: Map<String, Any?>): Set<String> {
        val value =
            CLAIM_PATH.fold<String, Any?>(claims) { current, segment ->
                (current as? Map<*, *>)?.get(segment)
            }
        return when (value) {
            is String -> setOf(value)
            is Collection<*> -> value.filterIsInstance<String>().toSet()
            else -> emptySet()
        }
    }

    companion object {
        private val CLAIM_PATH = listOf("realm_access", "roles")

        /** Applies the `ADMIN` implies every role rule, returning roles in declaration order. */
        fun expand(roles: Collection<UserRole>): Set<UserRole> =
            if (UserRole.ADMIN in roles) UserRole.entries.toSet()
            else UserRole.entries.filter { it in roles }.toSet()
    }
}
