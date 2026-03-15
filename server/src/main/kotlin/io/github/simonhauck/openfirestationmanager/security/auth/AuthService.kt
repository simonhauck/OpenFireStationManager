package io.github.simonhauck.openfirestationmanager.security.auth

import io.github.simonhauck.openfirestationmanager.security.shared.JwtTokenUtility
import io.github.simonhauck.openfirestationmanager.user.UserService
import kotlin.time.Duration.Companion.seconds
import org.springframework.security.authentication.AuthenticationManager
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.stereotype.Service

data class AuthTokenResponse(val token: String)

@Service
class AuthService(
    private val authenticationManager: AuthenticationManager,
    private val userService: UserService,
    private val jwtTokenUtility: JwtTokenUtility,
    private val userProvider: UserProvider,
) {
    fun login(loginRequest: LoginRequest): AuthTokenResponse {
        val authentication =
            authenticationManager.authenticate(
                UsernamePasswordAuthenticationToken.unauthenticated(
                    loginRequest.username,
                    loginRequest.password,
                )
            )

        val userAccount =
            userService.findByUsername(authentication.name)
                ?: error("Authenticated user '${authentication.name}' could not be found")

        val tokenValidity = loginRequest.tokenValiditySeconds.seconds
        val token = jwtTokenUtility.generateTokenForUser(userAccount, tokenValidity)

        return AuthTokenResponse(token = token)
    }

    fun getUserByAuthentication(): AuthStateResponse {
        val currentUser = userProvider.getCurrentUser() ?: return AuthStateResponse(false, null)

        return AuthStateResponse(true, userService.findByUsername(currentUser))
    }
}
