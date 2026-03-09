package io.github.simonhauck.openfirestationmanager.security.auth

import io.github.simonhauck.openfirestationmanager.security.config.AuthenticationProperties
import jakarta.servlet.http.HttpServletResponse
import jakarta.validation.Valid
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Positive
import kotlin.collections.sorted
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseCookie
import org.springframework.http.ResponseEntity
import org.springframework.security.core.Authentication
import org.springframework.validation.annotation.Validated
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController

data class LoginRequest(
    @field:NotBlank val username: String,
    @field:NotBlank val password: String,
    @field:Positive val tokenValiditySeconds: Long = 3600,
)

data class AuthUserResponse(val username: String, val roles: List<String>)

data class AuthStateResponse(val authenticated: Boolean, val user: AuthUserResponse?)

@RestController
@RequestMapping("/api/public/auth")
@Validated
class AuthController(
    private val authService: AuthService,
    private val appSecurityProperties: AuthenticationProperties,
) {

    @PostMapping("/login")
    fun login(
        @Valid @RequestBody requestBody: LoginRequest,
        response: HttpServletResponse,
    ): ResponseEntity<Unit> {
        val tokenResult = authService.login(requestBody)

        val cookie =
            ResponseCookie.from(appSecurityProperties.cookieName, tokenResult.token)
                .httpOnly(true)
                .secure(true)
                .path("/")
                .maxAge(requestBody.tokenValiditySeconds)
                .sameSite("Strict")
                .build()

        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString())
        return ResponseEntity.noContent().build()
    }

    @PostMapping("/logout")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun logout(response: HttpServletResponse): ResponseEntity<Unit> {
        val expiredCookie =
            ResponseCookie.from(appSecurityProperties.cookieName, "")
                .path("/")
                .httpOnly(true)
                .secure(true)
                .maxAge(0)
                .sameSite("Strict")
                .build()

        response.setHeader(HttpHeaders.SET_COOKIE, expiredCookie.toString())
        return ResponseEntity.noContent().build()
    }

    @GetMapping("/me")
    fun me(authentication: Authentication?): AuthStateResponse {
        if (
            authentication == null ||
                !authentication.isAuthenticated ||
                authentication.name == "anonymousUser"
        ) {
            return AuthStateResponse(authenticated = false, user = null)
        }

        return authentication.toAuthStateResponse()
    }

    private fun Authentication.toAuthStateResponse(): AuthStateResponse {
        val roles =
            authorities
                .mapNotNull { authority -> authority.authority?.removePrefix("ROLE_") }
                .sorted()

        return AuthStateResponse(
            authenticated = true,
            user = AuthUserResponse(username = name, roles = roles),
        )
    }
}
