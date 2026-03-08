package io.github.simonhauck.openfirestationmanager.user

import jakarta.validation.Valid
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.validation.annotation.Validated
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/admin/users")
@Validated
class AdminUserController(private val userService: UserService) {

    @PostMapping
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    fun createUser(@Valid @RequestBody requestBody: CreateUserRequest): UserAccount {
        return userService.createUser(requestBody)
    }
}
