package io.github.simonhauck.openfirestationmanager.security.auth

import io.github.simonhauck.openfirestationmanager.common.ApiTags
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.Parameter
import io.swagger.v3.oas.annotations.responses.ApiResponse
import io.swagger.v3.oas.annotations.responses.ApiResponses
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import java.net.URI
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.security.web.authentication.logout.SecurityContextLogoutHandler
import org.springframework.validation.annotation.Validated
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/public/auth")
@Validated
@Tag(name = ApiTags.AUTHENTICATION)
class AuthController(
    private val authService: AuthService,
    private val providerLogoutUrlResolver: ProviderLogoutUrlResolver,
) {

    @GetMapping("/login")
    @ResponseStatus(HttpStatus.FOUND)
    @Operation(
        operationId = "login",
        summary = "Sign in through the OpenID Connect provider",
        description =
            "Browser entry point for signing in. Navigate to it (a top-level navigation, not a " +
                "fetch call): the server remembers `redirect` and sends the browser to the " +
                "provider's login page. After a successful sign-in the provider returns to the " +
                "server, which sets the `OFSM_AUTH` session cookie and redirects to `redirect`. " +
                "While the provider session is still valid this happens without a password " +
                "prompt.\n\n" +
                "Only relative paths on this site are accepted as `redirect`. Anything else " +
                "(absolute URLs, `//host` paths) falls back to `/dashboard`, so this endpoint " +
                "cannot be used as an open redirect. A failed or cancelled sign-in ends on " +
                "`/login?error`.\n\n" +
                "Call `getCurrentSession` afterwards to find out who is signed in.",
    )
    @ApiResponses(
        ApiResponse(
            responseCode = "302",
            description = "Redirect towards the provider's login page.",
        ),
    )
    fun login(
        @Parameter(
            description =
                "Relative path to return to after signing in. Must start with `/`; anything " +
                    "else is replaced by `/dashboard`.",
            example = "/pool-clothing/checkout",
        )
        @RequestParam(defaultValue = LoginRedirect.FALLBACK)
        redirect: String,
        request: HttpServletRequest,
    ): ResponseEntity<Unit> {
        val target = LoginRedirect.sanitize(redirect)
        request.session.setAttribute(LoginRedirect.SESSION_ATTRIBUTE, target)
        return ResponseEntity.status(HttpStatus.FOUND)
            .location(URI.create(AUTHORIZATION_REQUEST_PATH))
            .build()
    }

    @PostMapping("/logout")
    @ResponseStatus(HttpStatus.FOUND)
    @Operation(
        operationId = "logout",
        summary = "End the current session",
        description =
            "Invalidates the server-side session and redirects the browser to the provider's " +
                "logout endpoint, which ends the provider session too and then returns to the " +
                "application root. Submit it as a top-level form `POST`, not a fetch call, so " +
                "the browser can follow the redirect to the provider.\n\n" +
                "Safe to call when not signed in — it then redirects straight to the application " +
                "root rather than failing, so it can be used unconditionally to guarantee a " +
                "clean slate.",
    )
    @ApiResponses(
        ApiResponse(
            responseCode = "302",
            description =
                "The session was ended. Redirect to the provider's logout endpoint, or to `/` " +
                    "when there was no provider session.",
        ),
    )
    fun logout(request: HttpServletRequest, response: HttpServletResponse): ResponseEntity<Unit> {
        val authentication = SecurityContextHolder.getContext().authentication
        val target = providerLogoutUrlResolver.resolve(request, response, authentication)
        SecurityContextLogoutHandler().logout(request, response, authentication)
        return ResponseEntity.status(HttpStatus.FOUND).location(URI.create(target)).build()
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
        ),
    )
    fun me(): AuthStateResponse {
        return authService.getCurrentSession()
    }

    companion object {
        /** Spring Security's authorization request endpoint for the `ofsm` registration. */
        const val AUTHORIZATION_REQUEST_PATH = "/oauth2/authorization/ofsm"
    }
}
