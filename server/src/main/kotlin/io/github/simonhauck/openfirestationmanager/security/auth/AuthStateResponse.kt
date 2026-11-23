package io.github.simonhauck.openfirestationmanager.security.auth

import io.github.simonhauck.openfirestationmanager.usermanagement.UserRole
import io.swagger.v3.oas.annotations.media.Schema

@Schema(
    description =
        "Who the caller is currently signed in as. Returned with `authenticated: false` and a " +
            "null `user` rather than a `401` when there is no valid session.",
)
data class AuthStateResponse(
    @field:Schema(
        description = "True when a valid session cookie was supplied.",
        example = "true",
    )
    val authenticated: Boolean,
    @field:Schema(
        description =
            "The signed-in user, including the `roles` that govern access to every other " +
                "endpoint. Null when `authenticated` is false.",
    )
    val user: CurrentUser?,
)

@Schema(
    description =
        "The signed-in user as reported by the OpenID Connect provider. Nothing about the user " +
            "is stored by this API; every value comes from the provider's tokens at sign-in.",
)
data class CurrentUser(
    @field:Schema(
        description =
            "Username from the provider (by default its `preferred_username` claim). This is " +
                "the name recorded in `createdBy` and `lastModifiedBy`.",
        example = "m.mustermann",
    )
    val username: String,
    @field:Schema(description = "Given name.", example = "Max") val firstName: String,
    @field:Schema(description = "Family name.", example = "Mustermann") val lastName: String,
    @field:Schema(
        description = "Email address, when the provider supplies one.",
        example = "max.mustermann@example.org",
    )
    val email: String? = null,
    @field:Schema(
        description =
            "Effective roles, derived from the provider's roles through the server's role " +
                "mapping. `ADMIN` is always reported together with every other role.",
        example = "[\"USER\", \"KLEIDERWART\"]",
    )
    val roles: List<UserRole>,
)
