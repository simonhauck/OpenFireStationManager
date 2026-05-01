package io.github.simonhauck.openfirestationmanager.testing

import io.github.simonhauck.openfirestationmanager.usermanagement.CreateUserRequest
import io.github.simonhauck.openfirestationmanager.usermanagement.UserAccount
import io.github.simonhauck.openfirestationmanager.usermanagement.UserService
import jakarta.validation.Valid
import org.springframework.context.annotation.Profile
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/test")
@Profile("test")
class TestUserController(private val userService: UserService) {

    @PostMapping("/users")
    @ResponseStatus(HttpStatus.CREATED)
    fun createTestUser(@Valid @RequestBody request: CreateUserRequest): UserAccount {
        return userService.createUser(request)
    }
}
