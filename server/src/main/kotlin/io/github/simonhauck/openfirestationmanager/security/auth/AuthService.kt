package io.github.simonhauck.openfirestationmanager.security.auth

import io.github.simonhauck.openfirestationmanager.security.shared.JwtTokenUtility
import io.github.simonhauck.openfirestationmanager.usermanagement.UserService
import kotlin.time.Duration.Companion.seconds
import org.springframework.security.authentication.AuthenticationManager
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.core.userdetails.UserDetailsService
import org.springframework.stereotype.Service

data class AuthTokenResponse(val token: String)

@Service
class AuthService(
    private val authenticationManager: AuthenticationManager,
    private val userService: UserService,
    private val jwtTokenUtility: JwtTokenUtility,
    private val currentUserProvider: CurrentUserProvider,
    private val userDetailsService: UserDetailsService,
) {
    fun login(loginRequest: LoginRequest): AuthTokenResponse {
        val authentication =
            authenticationManager.authenticate(
                UsernamePasswordAuthenticationToken.unauthenticated(
                    loginRequest.username,
                    loginRequest.password,
                )
            )

        val userName = authentication.name
        val roles =
            authentication.authorities.mapNotNull { it.authority }.filter { it.startsWith("ROLE_") }

        val tokenValidity = loginRequest.tokenValiditySeconds.seconds
        val token = jwtTokenUtility.generateToken(userName, roles, tokenValidity)

        return AuthTokenResponse(token = token)
    }

    fun getUserByAuthentication(): AuthStateResponse {
        val currentUser =
            currentUserProvider.getCurrentUser() ?: return AuthStateResponse(false, null)

        return AuthStateResponse(true, userService.findByUsername(currentUser))
    }
}
