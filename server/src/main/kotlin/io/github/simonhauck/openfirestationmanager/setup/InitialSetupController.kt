package io.github.simonhauck.openfirestationmanager.setup

import io.github.simonhauck.openfirestationmanager.common.ApiTags
import io.github.simonhauck.openfirestationmanager.common.PublicApiException
import io.github.simonhauck.openfirestationmanager.usermanagement.CreateUserRequest
import io.github.simonhauck.openfirestationmanager.usermanagement.UserAccount
import io.github.simonhauck.openfirestationmanager.usermanagement.UserRole
import io.github.simonhauck.openfirestationmanager.usermanagement.UserService
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.media.Content
import io.swagger.v3.oas.annotations.media.Schema
import io.swagger.v3.oas.annotations.responses.ApiResponse
import io.swagger.v3.oas.annotations.responses.ApiResponses
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size
import org.springframework.http.HttpStatus
import org.springframework.http.ProblemDetail
import org.springframework.validation.annotation.Validated
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@Schema(description = "Details of the very first administrator account.")
data class InitialAdminSetupRequest(
    @field:Schema(description = "Username for the new administrator.", example = "admin")
    @field:NotBlank
    val username: String,
    @field:Schema(
        description = "Plaintext password. Between 4 and 32 characters.",
        example = "correct-horse",
    )
    @field:NotBlank
    @field:Size(min = 4, max = 32)
    val password: String,
    @field:Schema(description = "Given name of the administrator.", example = "Max")
    @field:NotBlank
    @field:Size(max = 100)
    val firstName: String,
    @field:Schema(description = "Family name of the administrator.", example = "Mustermann")
    @field:NotBlank
    @field:Size(max = 100)
    val lastName: String,
)

@RestController
@RequestMapping("/api/public/setup")
@Validated
@Tag(name = ApiTags.SETUP)
class InitialSetupController(private val userService: UserService) {

    @PostMapping("/initial-admin")
    @Operation(
        operationId = "createInitialAdmin",
        summary = "Bootstrap the first administrator account",
        description =
            "Creates the very first user and grants it the `ADMIN` role. This exists to solve " +
                "the chicken-and-egg problem of a fresh installation: it is the only way to " +
                "create an account without already holding one.\n\n" +
                "It is therefore public, but usable **exactly once**. The moment any user account " +
                "exists — including one created here — this endpoint refuses every further call " +
                "with `409 Conflict`. Create subsequent accounts with `createUser` instead.\n\n" +
                "A `409` is the normal response on an already-configured installation and should " +
                "be treated as \"setup already done\", not as an error to retry.",
    )
    @ApiResponses(
        ApiResponse(
            responseCode = "200",
            description = "The administrator account was created and is ready to sign in.",
        ),
        ApiResponse(
            responseCode = "409",
            description = "At least one user already exists, so setup has already been completed.",
            content =
                [
                    Content(
                        mediaType = "application/problem+json",
                        schema = Schema(implementation = ProblemDetail::class),
                    )
                ],
        ),
    )
    fun initializeAdmin(@Valid @RequestBody requestBody: InitialAdminSetupRequest): UserAccount {
        if (userService.hasAnyUsers()) {
            throw PublicApiException(
                status = HttpStatus.CONFLICT,
                publicMessage = "Initial admin is already configured",
            )
        }

        val created =
            userService.createUser(
                CreateUserRequest(
                    username = requestBody.username,
                    password = requestBody.password,
                    firstName = requestBody.firstName,
                    lastName = requestBody.lastName,
                    roles = listOf(UserRole.ADMIN),
                )
            )

        return created
    }
}
