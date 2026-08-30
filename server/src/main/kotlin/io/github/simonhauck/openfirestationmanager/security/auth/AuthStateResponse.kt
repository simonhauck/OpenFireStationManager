package io.github.simonhauck.openfirestationmanager.security.auth

import io.github.simonhauck.openfirestationmanager.usermanagement.UserAccount
import io.swagger.v3.oas.annotations.media.Schema

@Schema(
    description =
        "Who the caller is currently signed in as. Returned with `authenticated: false` and a " +
            "null `user` rather than a `401` when there is no valid session."
)
data class AuthStateResponse(
    @field:Schema(
        description = "True when a valid session cookie was supplied.",
        example = "true",
    )
    val authenticated: Boolean,
    @field:Schema(
        description =
            "The signed-in account, including the `roles` that govern access to every other " +
                "endpoint. Null when `authenticated` is false."
    )
    val user: UserAccount?,
)
