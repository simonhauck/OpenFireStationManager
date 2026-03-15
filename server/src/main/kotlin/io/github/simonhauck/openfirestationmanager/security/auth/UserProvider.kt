package io.github.simonhauck.openfirestationmanager.security.auth

import io.github.simonhauck.openfirestationmanager.common.PublicApiException
import org.springframework.http.HttpStatus
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.stereotype.Component

@Component
class UserProvider {

    fun getCurrentUserOrThrow(): String {
        val authentication =
            SecurityContextHolder.getContext().authentication
                ?: throw PublicApiException(
                    status = HttpStatus.UNAUTHORIZED,
                    publicMessage = "You are not authenticated",
                )

        return authentication.name
    }

    fun getCurrentUser(): String? {
        val authentication = SecurityContextHolder.getContext().authentication ?: return null
        return authentication.name
    }
}
