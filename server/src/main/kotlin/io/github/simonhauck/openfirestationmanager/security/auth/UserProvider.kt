package io.github.simonhauck.openfirestationmanager.security.auth

import io.github.simonhauck.openfirestationmanager.common.PublicApiException
import org.springframework.http.HttpStatus
import org.springframework.security.authentication.AnonymousAuthenticationProvider
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.stereotype.Component

@Component
class UserProvider {

    fun getCurrentUserOrThrow(): String {
        return getCurrentUser()
            ?: throw PublicApiException(
                status = HttpStatus.UNAUTHORIZED,
                publicMessage = "You are not authenticated",
            )
    }

    fun getCurrentUser(): String? {
        val authenticationResult = SecurityContextHolder.getContext().authentication ?: return null

        if (!authenticationResult.isAuthenticated) return null

        if (authenticationResult is AnonymousAuthenticationProvider) return null

        if (authenticationResult.name == "anonymousUser") return null

        return authenticationResult.name
    }
}
