package io.github.simonhauck.openfirestationmanager.testing

import io.github.simonhauck.openfirestationmanager.common.ApiTags
import io.github.simonhauck.openfirestationmanager.security.auth.SessionPrincipal
import io.github.simonhauck.openfirestationmanager.usermanagement.UserRole
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.media.Schema
import io.swagger.v3.oas.annotations.responses.ApiResponse
import io.swagger.v3.oas.annotations.responses.ApiResponses
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import jakarta.validation.Valid
import jakarta.validation.constraints.NotBlank
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.core.authority.SimpleGrantedAuthority
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.security.web.context.SecurityContextRepository
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController

@Schema(description = "The identity and roles of the session to create.")
data class TestSessionRequest(
    @field:Schema(description = "Login name of the session's user.", example = "m.mustermann")
    @field:NotBlank
    val username: String,
    @field:Schema(description = "Given name.", example = "Max")
    @field:NotBlank
    val firstName: String,
    @field:Schema(description = "Family name.", example = "Mustermann")
    @field:NotBlank
    val lastName: String,
    @field:Schema(
        description =
            "Roles the session holds. `ADMIN` implicitly grants every other role, exactly as for " +
                "a normal login.",
        example = "[\"USER\"]",
    )
    val roles: List<UserRole>,
)

@RestController
@RequestMapping("/api/test")
@ConditionalOnProperty(name = ["app.testing.enabled"], havingValue = "true")
@Tag(name = ApiTags.TEST)
class TestSessionController(private val securityContextRepository: SecurityContextRepository) {

    @PostMapping("/session")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(
        operationId = "createTestSession",
        summary = "Start a session without credentials",
        description =
            "Test-only fixture endpoint. Creates an authenticated session for the given " +
                "identity and roles and returns it as an `OFSM_AUTH` cookie, without a password " +
                "and without any row in the user table. Use `getCurrentSession` afterwards to " +
                "see who the session belongs to. Available only with the test profile.",
    )
    @ApiResponses(
        ApiResponse(
            responseCode = "204",
            description = "The session was created. Its cookie is in the `Set-Cookie` header.",
        ),
    )
    fun createSession(
        @Valid @RequestBody requestBody: TestSessionRequest,
        request: HttpServletRequest,
        response: HttpServletResponse,
    ): ResponseEntity<Unit> {
        val grantedRoles =
            if (requestBody.roles.contains(UserRole.ADMIN)) UserRole.entries
            else requestBody.roles.distinct()
        val principal =
            SessionPrincipal(
                username = requestBody.username,
                firstName = requestBody.firstName,
                lastName = requestBody.lastName,
                roles = requestBody.roles,
            )
        val authentication =
            UsernamePasswordAuthenticationToken.authenticated(
                principal,
                null,
                grantedRoles.map { SimpleGrantedAuthority("ROLE_${it.name}") },
            )

        // Always start a fresh session, so a caller that still sends an older cookie gets a new
        // one instead of overwriting (and sharing) the previous session.
        request.getSession(false)?.invalidate()

        val securityContext = SecurityContextHolder.createEmptyContext()
        securityContext.authentication = authentication
        SecurityContextHolder.setContext(securityContext)
        securityContextRepository.saveContext(securityContext, request, response)

        return ResponseEntity.noContent().build()
    }
}
