package io.github.simonhauck.openfirestationmanager.security.auth

import io.github.simonhauck.openfirestationmanager.usermanagement.UserService
import org.springframework.security.authentication.AuthenticationManager
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.core.Authentication
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
            )
        )
    }

    fun getUserByAuthentication(): AuthStateResponse {
        val currentUser =
            currentUserProvider.getCurrentUser() ?: return AuthStateResponse(false, null)

        return AuthStateResponse(true, userService.findByUsername(currentUser))
    }
}
