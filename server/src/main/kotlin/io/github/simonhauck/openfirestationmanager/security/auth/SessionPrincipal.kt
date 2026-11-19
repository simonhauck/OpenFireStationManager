package io.github.simonhauck.openfirestationmanager.security.auth

import io.github.simonhauck.openfirestationmanager.usermanagement.UserRole
import java.io.Serializable
import java.security.Principal

/**
 * Identity carried by a session that is not backed by a row in the `users` table. It holds
 * everything `getCurrentSession` needs to describe the caller.
 */
data class SessionPrincipal(
    val username: String,
    val firstName: String,
    val lastName: String,
    val roles: List<UserRole>,
) : Principal, Serializable {
    override fun getName(): String = username
}
