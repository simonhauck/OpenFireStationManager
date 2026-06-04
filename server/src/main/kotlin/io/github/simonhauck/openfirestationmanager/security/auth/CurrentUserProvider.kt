package io.github.simonhauck.openfirestationmanager.security.auth

import io.github.simonhauck.openfirestationmanager.common.PublicApiException
import io.github.simonhauck.openfirestationmanager.usermanagement.UserRole
import org.springframework.http.HttpStatus
import org.springframework.security.authentication.AnonymousAuthenticationProvider
import org.springframework.security.core.Authentication
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.stereotype.Component

@Component
class CurrentUserProvider {

    fun getCurrentUserOrThrow(): String {
        return getCurrentUser()
            ?: throw PublicApiException(
                status = HttpStatus.UNAUTHORIZED,
                publicMessage = "You are not authenticated",
            )
    }

    fun getCurrentUser(): String? {
        val authenticationResult = SecurityContextHolder.getContext().authentication ?: return null

        if (!authenticationResult.checkIsUserAuthenticated()) return null

        return authenticationResult.name
    }

    fun checkCurrentUserHasRole(role: UserRole): Boolean {
        val authentication = SecurityContextHolder.getContext().authentication ?: return false

        if (!authentication.checkIsUserAuthenticated()) return false

        return authentication.authorities
            .mapNotNull { it.authority?.removePrefix("ROLE_") }
            .any { it == role.name }
    }

    private fun Authentication.checkIsUserAuthenticated(): Boolean {
        if (!this.isAuthenticated) return false

        if (this is AnonymousAuthenticationProvider) return false

        if (this.name == "anonymousUser") return false
        return true
    }
}
