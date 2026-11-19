package io.github.simonhauck.openfirestationmanager.security.auth

import io.github.simonhauck.openfirestationmanager.usermanagement.UserAccount
import io.github.simonhauck.openfirestationmanager.usermanagement.UserService
import org.springframework.security.authentication.AuthenticationManager
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.core.Authentication
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.stereotype.Service

@Service
class AuthService(
    private val authenticationManager: AuthenticationManager,
    private val userService: UserService,
    private val currentUserProvider: CurrentUserProvider,
) {
    fun login(loginRequest: LoginRequest): Authentication {
        return authenticationManager.authenticate(
            UsernamePasswordAuthenticationToken.unauthenticated(
                loginRequest.username,
                loginRequest.password,
            ),
        )
    }

    fun getUserByAuthentication(): AuthStateResponse {
        val currentUser =
            currentUserProvider.getCurrentUser() ?: return AuthStateResponse(false, null)

        val user = userService.findByUsername(currentUser) ?: sessionPrincipalAccount()
        return AuthStateResponse(true, user)
    }

    private fun sessionPrincipalAccount(): UserAccount? {
        val principal =
            SecurityContextHolder.getContext().authentication?.principal as? SessionPrincipal
                ?: return null
        return UserAccount(
            username = principal.username,
            firstName = principal.firstName,
            lastName = principal.lastName,
            roles = principal.roles,
        )
    }
}
