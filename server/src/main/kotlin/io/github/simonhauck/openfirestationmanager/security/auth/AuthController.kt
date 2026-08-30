package io.github.simonhauck.openfirestationmanager.security.auth

import io.github.simonhauck.openfirestationmanager.common.ApiTags
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.media.Content
import io.swagger.v3.oas.annotations.media.Schema
import io.swagger.v3.oas.annotations.responses.ApiResponse
import io.swagger.v3.oas.annotations.responses.ApiResponses
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import jakarta.validation.Valid
import jakarta.validation.constraints.NotBlank
import org.springframework.http.HttpStatus
import org.springframework.http.ProblemDetail
import org.springframework.http.ResponseEntity
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.security.web.authentication.rememberme.TokenBasedRememberMeServices
import org.springframework.security.web.context.SecurityContextRepository
import org.springframework.validation.annotation.Validated
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController

@Schema(description = "Credentials for starting a session.")
data class LoginRequest(
    @field:Schema(description = "The account's username.", example = "m.mustermann")
    @field:NotBlank
    val username: String,
    @field:Schema(description = "The account's plaintext password.", example = "correct-horse")
    @field:NotBlank
    val password: String,
    @field:Schema(
        description =
            "When true, the server additionally issues a long-lived remember-me cookie " +
                "(`OFSM_AUTH_REMEMBER_ME`) that authenticates on its own for 30 days. Prefer " +
                "this for long-lived clients rather than holding a session open.",
        example = "false",
    )
    val rememberMe: Boolean = false,
)

@RestController
@RequestMapping("/api/public/auth")
@Validated
@Tag(name = ApiTags.AUTHENTICATION)
class AuthController(
    private val authService: AuthService,
    private val securityContextRepository: SecurityContextRepository,
    private val rememberMeServices: TokenBasedRememberMeServices,
) {

    @PostMapping("/login")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(
        operationId = "login",
        summary = "Start a session",
        description =
            "Exchanges a username and password for a session cookie. This API has no bearer " +
                "tokens: on success the server sets an `OFSM_AUTH` cookie (plus " +
                "`OFSM_AUTH_REMEMBER_ME` when `rememberMe` is true), and every subsequent request " +
                "must carry it.\n\n" +
                "The response body is deliberately empty — call `getCurrentSession` afterwards " +
                "to find out who you are signed in as and which roles you hold.\n\n" +
                "Wrong credentials and unknown usernames are reported identically, as `401`, so " +
                "the response cannot be used to discover which accounts exist.",
    )
    @ApiResponses(
        ApiResponse(
            responseCode = "204",
            description = "Signed in. The session cookie is in the `Set-Cookie` header.",
        ),
        ApiResponse(
            responseCode = "401",
            description = "The username does not exist, or the password is wrong.",
            content =
                [
                    Content(
                        mediaType = "application/problem+json",
                        schema = Schema(implementation = ProblemDetail::class),
                    )
                ],
        ),
    )
    fun login(
        @Valid @RequestBody requestBody: LoginRequest,
        request: HttpServletRequest,
        response: HttpServletResponse,
    ): ResponseEntity<Unit> {
        val authentication = authService.login(requestBody)

        val securityContext = SecurityContextHolder.createEmptyContext()
        securityContext.authentication = authentication
        SecurityContextHolder.setContext(securityContext)
        securityContextRepository.saveContext(securityContext, request, response)

        if (requestBody.rememberMe) {
            rememberMeServices.loginSuccess(request, response, authentication)
        }

        return ResponseEntity.noContent().build()
    }

    @PostMapping("/logout")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(
        operationId = "logout",
        summary = "End the current session",
        description =
            "Invalidates the server-side session and clears both the session and remember-me " +
                "cookies.\n\n" +
                "Safe to call when not signed in — it succeeds either way rather than failing, " +
                "so it can be used unconditionally to guarantee a clean slate.",
    )
    @ApiResponses(ApiResponse(responseCode = "204", description = "The session was ended."))
    fun logout(request: HttpServletRequest, response: HttpServletResponse): ResponseEntity<Unit> {
        val authentication = SecurityContextHolder.getContext().authentication
        rememberMeServices.logout(request, response, authentication)
        SecurityContextHolder.clearContext()
        request.getSession(false)?.invalidate()
        return ResponseEntity.noContent().build()
    }

    @GetMapping("/me")
    @Operation(
        operationId = "getCurrentSession",
        summary = "Report who the caller is signed in as",
        description =
            "Describes the current session. Call this after `login`, or on start-up, to discover " +
                "the caller's identity and — importantly — the roles that decide which other " +
                "endpoints will be permitted.\n\n" +
                "This endpoint never fails on missing authentication. When no valid cookie is " +
                "present it returns `200` with `authenticated: false` and a null `user`, which " +
                "makes it a safe way to probe session state without handling a `401`.",
    )
    @ApiResponses(
        ApiResponse(
            responseCode = "200",
            description =
                "The current session state. Check `authenticated` before relying on `user`.",
        )
    )
    fun me(): AuthStateResponse {
        return authService.getUserByAuthentication()
    }
}
