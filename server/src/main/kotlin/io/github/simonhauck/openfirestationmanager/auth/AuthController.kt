package io.github.simonhauck.openfirestationmanager.auth

import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import jakarta.validation.Valid
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Positive
import org.springframework.http.HttpStatus
import org.springframework.security.authentication.AuthenticationManager
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.core.Authentication
import org.springframework.security.core.context.SecurityContext
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.security.core.context.SecurityContextHolderStrategy
import org.springframework.security.web.authentication.logout.SecurityContextLogoutHandler
import org.springframework.security.web.authentication.rememberme.PersistentTokenBasedRememberMeServices
import org.springframework.security.web.context.HttpSessionSecurityContextRepository
import org.springframework.security.web.csrf.CsrfToken
import org.springframework.validation.annotation.Validated
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import org.springframework.web.bind.annotation.ResponseStatus
import kotlin.collections.sorted

data class LoginRequest(
    @field:NotBlank
    val username: String,
    @field:NotBlank
    val password: String,
    @field:Positive
    val tokenValiditySeconds: Long = 3600,
    val rememberMe: Boolean = false,
)

data class AuthUserResponse(
    val username: String,
    val roles: List<String>,
)

data class AuthStateResponse(
    val authenticated: Boolean,
    val user: AuthUserResponse?,
)

@RestController
@RequestMapping("/api/auth")
@Validated
class AuthController(
    private val authenticationManager: AuthenticationManager,
    private val rememberMeServices: PersistentTokenBasedRememberMeServices,
) {
    private val logoutHandler = SecurityContextLogoutHandler()
    private val securityContextHolderStrategy: SecurityContextHolderStrategy = SecurityContextHolder.getContextHolderStrategy()

    @PostMapping("/login")
    fun login(
        @Valid @RequestBody requestBody: LoginRequest,
        request: HttpServletRequest,
        response: HttpServletResponse,
    ): AuthStateResponse {
        val auth =
            UsernamePasswordAuthenticationToken.unauthenticated(requestBody.username, requestBody.password)
        val authentication = authenticationManager.authenticate(
            auth,
        )

        val securityContext = createAuthenticatedContext(authentication)
        HttpSessionSecurityContextRepository().saveContext(securityContext, request, response)

        if (requestBody.rememberMe) {
            rememberMeServices.loginSuccess(request, response, authentication)
        }

        return authentication.toAuthStateResponse()
    }

    @PostMapping("/logout")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun logout(
        authentication: Authentication?,
        request: HttpServletRequest,
        response: HttpServletResponse,
    ) {
        if (authentication != null) {
            rememberMeServices.logout(request, response, authentication)
            logoutHandler.logout(request, response, authentication)
        }
    }

    @GetMapping("/me")
    fun me(authentication: Authentication?): AuthStateResponse {
        if (authentication == null || !authentication.isAuthenticated || authentication.name == "anonymousUser") {
            return AuthStateResponse(authenticated = false, user = null)
        }

        return authentication.toAuthStateResponse()
    }

    @GetMapping("/csrf")
    fun csrf(csrfToken: CsrfToken): Map<String, String> = mapOf("token" to csrfToken.token)

    private fun createAuthenticatedContext(newAuth: Authentication): SecurityContext {
        val context = securityContextHolderStrategy.createEmptyContext().apply {
            authentication = newAuth
        }
        securityContextHolderStrategy.context = context
        return context
    }

    private fun Authentication.toAuthStateResponse(): AuthStateResponse {
        val roles = authorities
            .mapNotNull { authority ->
                authority.authority?.removePrefix("ROLE_")
            }
            .sorted()

        return AuthStateResponse(
            authenticated = true,
            user = AuthUserResponse(
                username = name,
                roles = roles,
            ),
        )
    }
}
