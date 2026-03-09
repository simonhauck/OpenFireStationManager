package io.github.simonhauck.openfirestationmanager.setup

import io.github.simonhauck.openfirestationmanager.common.PublicApiException
import io.github.simonhauck.openfirestationmanager.user.CreateUserRequest
import io.github.simonhauck.openfirestationmanager.user.UserAccount
import io.github.simonhauck.openfirestationmanager.user.UserRole
import io.github.simonhauck.openfirestationmanager.user.UserService
import jakarta.validation.Valid
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size
import org.springframework.http.HttpStatus
import org.springframework.validation.annotation.Validated
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

data class InitialAdminSetupRequest(
    @field:NotBlank val username: String,
    @field:NotBlank @field:Size(min = 4, max = 32) val password: String,
)

@RestController
@RequestMapping("/api/public/setup")
@Validated
class InitialSetupController(private val userService: UserService) {

    @PostMapping("/initial-admin")
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
                    roles = listOf(UserRole.ADMIN),
                )
            )

        return created
    }
}
