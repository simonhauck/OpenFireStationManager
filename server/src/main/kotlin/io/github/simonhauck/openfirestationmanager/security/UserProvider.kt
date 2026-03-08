package io.github.simonhauck.openfirestationmanager.security

import io.github.simonhauck.openfirestationmanager.common.PublicApiException
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.stereotype.Component

@Component
class UserProvider {

    fun getCurrentUserName(): String? {
        val authentication =
            SecurityContextHolder.getContext().authentication
                ?: throw PublicApiException(
                    status = org.springframework.http.HttpStatus.UNAUTHORIZED,
                    publicMessage = "You are not authenticated",
                )

        return authentication.name
    }
}
