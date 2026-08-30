package io.github.simonhauck.openfirestationmanager.usermanagement

import io.github.simonhauck.openfirestationmanager.common.ApiTags
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.Parameter
import io.swagger.v3.oas.annotations.media.Content
import io.swagger.v3.oas.annotations.media.Schema
import io.swagger.v3.oas.annotations.responses.ApiResponse
import io.swagger.v3.oas.annotations.responses.ApiResponses
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import jakarta.validation.constraints.Positive
import org.springframework.http.ProblemDetail
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.validation.annotation.Validated
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PatchMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/admin/users")
@Validated
@Tag(name = ApiTags.ADMIN_USERS)
class AdminUserController(private val userService: UserService) {

    @GetMapping
    @Operation(
        operationId = "listUsers",
        summary = "List every user account",
        description =
            "Returns all accounts with their roles. Password hashes are never included.\n\n" +
                "This is the way to discover which account holds which role — useful before " +
                "changing someone's permissions, or to find out who the quartermasters are.",
    )
    @ApiResponses(ApiResponse(responseCode = "200", description = "All user accounts."))
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    fun getAllUsers(): List<UserAccount> {
        return userService.getAllUsers()
    }

    @GetMapping("/{id}")
    @Operation(
        operationId = "getUser",
        summary = "Get one user account by its numeric id",
        description = "Looks up a single account. The password hash is never included.",
    )
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "The user account."),
        ApiResponse(
            responseCode = "404",
            description = "No user exists with this id.",
            content =
                [
                    Content(
                        mediaType = "application/problem+json",
                        schema = Schema(implementation = ProblemDetail::class),
                    )
                ],
        ),
    )
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    fun getUserById(
        @Parameter(description = "Numeric id of the user account.", example = "5")
        @PathVariable
        @Positive
        id: Long
    ): UserAccount {
        return userService.getUserById(id)
    }

    @PostMapping
    @Operation(
        operationId = "createUser",
        summary = "Create a user account",
        description =
            "Registers a new account with an initial password and a set of roles. The password " +
                "is hashed before storage and never returned.\n\n" +
                "Usernames must be unique. Granting `ADMIN` implicitly grants every other role, " +
                "so there is no need to list `KLEIDERWART` alongside it.",
    )
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "The newly created account."),
        ApiResponse(
            responseCode = "409",
            description = "That username is already taken.",
            content =
                [
                    Content(
                        mediaType = "application/problem+json",
                        schema = Schema(implementation = ProblemDetail::class),
                    )
                ],
        ),
    )
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    fun createUser(@Valid @RequestBody requestBody: CreateUserRequest): UserAccount {
        return userService.createUser(requestBody)
    }

    @PatchMapping("/{id}")
    @Operation(
        operationId = "updateUser",
        summary = "Replace a user's profile and roles",
        description =
            "Despite the `PATCH` verb this is a **full replacement** of the name and the role " +
                "set. The `roles` list you send becomes the account's complete set of roles, so " +
                "omitting a role revokes it — read the account first if you mean to add one.\n\n" +
                "The username cannot be changed here, and the password is changed through " +
                "`changeUserPassword`.",
    )
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "The updated account."),
        ApiResponse(
            responseCode = "404",
            description = "No user exists with this id.",
            content =
                [
                    Content(
                        mediaType = "application/problem+json",
                        schema = Schema(implementation = ProblemDetail::class),
                    )
                ],
        ),
    )
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    fun updateUser(
        @Parameter(description = "Numeric id of the user account to update.", example = "5")
        @PathVariable
        @Positive
        id: Long,
        @Valid @RequestBody requestBody: UpdateUserRequest,
    ): UserAccount {
        return userService.updateUser(id, requestBody)
    }

    @PutMapping("/{id}/password")
    @Operation(
        operationId = "changeUserPassword",
        summary = "Set a user's password",
        description =
            "Overwrites an account's password. This is an administrative reset: the account's " +
                "current password is **not** required, and existing sessions are not " +
                "invalidated.\n\n" +
                "Returns the account, which as always omits the password hash.",
    )
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "The account, with its password changed."),
        ApiResponse(
            responseCode = "404",
            description = "No user exists with this id.",
            content =
                [
                    Content(
                        mediaType = "application/problem+json",
                        schema = Schema(implementation = ProblemDetail::class),
                    )
                ],
        ),
    )
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    fun changePassword(
        @Parameter(description = "Numeric id of the user account.", example = "5")
        @PathVariable
        @Positive
        id: Long,
        @Valid @RequestBody requestBody: ChangePasswordRequest,
    ): UserAccount {
        return userService.changePassword(id, requestBody)
    }
}
