package io.github.simonhauck.openfirestationmanager.security.auth

import io.github.simonhauck.openfirestationmanager.usermanagement.UserRole
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.security.oauth2.core.oidc.user.OidcUser
import org.springframework.stereotype.Service

@Service
class AuthService(private val currentUserProvider: CurrentUserProvider) {

    fun getCurrentSession(): AuthStateResponse {
        val username = currentUserProvider.getCurrentUser() ?: return AuthStateResponse(false, null)
        val authentication =
            SecurityContextHolder.getContext().authentication
                ?: return AuthStateResponse(false, null)

        val roles =
            UserRole.entries.filter { role ->
                authentication.authorities.any {
                    it.authority == "${OfsmUserFactory.ROLE_PREFIX}${role.name}"
                }
            }
        val oidcUser = authentication.principal as? OidcUser

        return AuthStateResponse(
            authenticated = true,
            user =
                CurrentUser(
                    username = username,
                    firstName = oidcUser?.givenName.orEmpty(),
                    lastName = oidcUser?.familyName.orEmpty(),
                    email = oidcUser?.email,
                    roles = roles,
                ),
        )
    }
}
