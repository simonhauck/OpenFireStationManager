package io.github.simonhauck.openfirestationmanager.security.auth

import io.github.simonhauck.openfirestationmanager.usermanagement.UserRole

/**
 * Derives the effective OFSM roles from a provider's claims. Framework-free, so the browser login
 * and future token-based paths share exactly the same rules.
 *
 * Provider roles are collected from every claim path in [claimPaths] (dot-separated navigation into
 * nested claim objects, e.g. `realm_access.roles` or `groups`) and unioned. A claim value may be an
 * array of strings or a single string; paths that do not resolve are ignored. [mapping] lists, per
 * OFSM role, the provider role names that grant it (exact, case-sensitive match). Without a mapping
 * every OFSM role maps to the provider role of the same name; with a mapping only its entries
 * apply. A user holding `ADMIN` receives every OFSM role.
 */
class RoleMapper(
    private val claimPaths: List<String> = DEFAULT_CLAIM_PATHS,
    private val mapping: Map<UserRole, List<String>>? = null,
) {

    fun map(claims: Map<String, Any?>): Set<UserRole> {
        val providerRoles = claimPaths.flatMapTo(mutableSetOf()) { providerRolesAt(claims, it) }
        val granted =
            UserRole.entries.filter { role ->
                providerNamesFor(role).any { it in providerRoles }
            }
        return expand(granted)
    }

    private fun providerNamesFor(role: UserRole): List<String> =
        if (mapping == null) listOf(role.name) else mapping[role].orEmpty()

    private fun providerRolesAt(claims: Map<String, Any?>, path: String): Set<String> {
        val value =
            path.split(PATH_SEPARATOR).fold<String, Any?>(claims) { current, segment ->
                (current as? Map<*, *>)?.get(segment)
            }
        return when (value) {
            is String -> setOf(value)
            is Collection<*> -> value.filterIsInstance<String>().toSet()
            else -> emptySet()
        }
    }

    companion object {
        const val PATH_SEPARATOR = "."
        val DEFAULT_CLAIM_PATHS = listOf("realm_access.roles")

        /** Applies the `ADMIN` implies every role rule, returning roles in declaration order. */
        fun expand(roles: Collection<UserRole>): Set<UserRole> =
            if (UserRole.ADMIN in roles) UserRole.entries.toSet()
            else UserRole.entries.filter { it in roles }.toSet()
    }
}
