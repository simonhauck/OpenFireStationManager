package io.github.simonhauck.openfirestationmanager.testing

import io.github.simonhauck.openfirestationmanager.common.ApiTags
import io.github.simonhauck.openfirestationmanager.security.auth.OfsmUserFactory
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
import java.time.Duration
import java.time.Instant
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken
import org.springframework.security.oauth2.core.oidc.IdTokenClaimNames
import org.springframework.security.oauth2.core.oidc.OidcIdToken
import org.springframework.security.oauth2.core.oidc.StandardClaimNames
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
class TestSessionController(
    private val securityContextRepository: SecurityContextRepository,
    private val ofsmUserFactory: OfsmUserFactory,
) {

    @PostMapping("/session")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(
        operationId = "createTestSession",
        summary = "Start a session without credentials",
        description =
            "Test-only fixture endpoint. Creates an authenticated session for the given " +
                "identity and roles and returns it as an `OFSM_AUTH` cookie, without going " +
                "through the OpenID Connect provider. The session is indistinguishable from one " +
                "created by `login`. Use `getCurrentSession` afterwards to see who the session " +
                "belongs to. Available only with the test profile.",
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
        val now = Instant.now()
        val idToken =
            OidcIdToken(
                TEST_ID_TOKEN_VALUE,
                now,
                now.plus(Duration.ofHours(12)),
                mapOf(
                    IdTokenClaimNames.SUB to requestBody.username,
                    StandardClaimNames.PREFERRED_USERNAME to requestBody.username,
                    StandardClaimNames.GIVEN_NAME to requestBody.firstName,
                    StandardClaimNames.FAMILY_NAME to requestBody.lastName,
                ),
            )
        val principal = ofsmUserFactory.create(idToken, null, requestBody.roles)
        val authentication =
            OAuth2AuthenticationToken(principal, principal.authorities, REGISTRATION_ID)


        val securityContext = SecurityContextHolder.createEmptyContext()
        securityContext.authentication = authentication
        SecurityContextHolder.setContext(securityContext)
        securityContextRepository.saveContext(securityContext, request, response)

        return ResponseEntity.noContent().build()
    }

    private companion object {
        const val REGISTRATION_ID = "ofsm"
        const val TEST_ID_TOKEN_VALUE = "test-session"
    }
}
