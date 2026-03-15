package io.github.simonhauck.openfirestationmanager.security.auth

import io.github.simonhauck.openfirestationmanager.security.config.AuthenticationProperties
import io.github.simonhauck.openfirestationmanager.user.UserService
import jakarta.servlet.http.HttpServletResponse
import jakarta.validation.Valid
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Positive
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseCookie
import org.springframework.http.ResponseEntity
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

@RestController
@RequestMapping("/api/public/auth")
@Validated
class AuthController(
    private val authService: AuthService,
    private val appSecurityProperties: AuthenticationProperties,
    private val userService: UserService,
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
    fun me(): AuthStateResponse {
        return authService.getUserByAuthentication()
    }
}
