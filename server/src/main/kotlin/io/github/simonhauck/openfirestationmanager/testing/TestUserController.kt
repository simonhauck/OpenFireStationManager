package io.github.simonhauck.openfirestationmanager.testing

import io.github.simonhauck.openfirestationmanager.common.ApiTags
import io.github.simonhauck.openfirestationmanager.usermanagement.CreateUserRequest
import io.github.simonhauck.openfirestationmanager.usermanagement.UserAccount
import io.github.simonhauck.openfirestationmanager.usermanagement.UserService
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.responses.ApiResponse
import io.swagger.v3.oas.annotations.responses.ApiResponses
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/test")
@ConditionalOnProperty(name = ["app.testing.enabled"], havingValue = "true")
@Tag(name = ApiTags.TEST)
class TestUserController(private val userService: UserService) {

    @PostMapping("/users")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(
        operationId = "seedTestUser",
        summary = "Seed a user account",
        description =
            "Test-only fixture endpoint. Creates a user account through the production user " +
                "service so the Playwright global setup can create one persona per role. " +
                "Available only with the test profile.",
    )
    @ApiResponses(ApiResponse(responseCode = "201", description = "The newly created account."))
    fun createTestUser(@Valid @RequestBody request: CreateUserRequest): UserAccount {
        return userService.createUser(request)
    }
}
