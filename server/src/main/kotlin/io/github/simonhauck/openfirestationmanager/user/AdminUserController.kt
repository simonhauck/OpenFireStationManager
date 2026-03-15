package io.github.simonhauck.openfirestationmanager.user

import jakarta.validation.Valid
import jakarta.validation.constraints.Positive
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.validation.annotation.Validated
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PatchMapping
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/admin/users")
@Validated
class AdminUserController(private val userService: UserService) {

    @GetMapping
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    fun getAllUsers(): List<UserAccount> {
        return userService.getAllUsers()
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    fun getUserById(@PathVariable @Positive id: Long): UserAccount {
        return userService.getUserById(id)
    }

    @PostMapping
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    fun createUser(@Valid @RequestBody requestBody: CreateUserRequest): UserAccount {
        return userService.createUser(requestBody)
    }

    @PatchMapping("/{id}")
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    fun updateUser(
        @PathVariable @Positive id: Long,
        @Valid @RequestBody requestBody: UpdateUserRequest,
    ): UserAccount {
        return userService.updateUser(id, requestBody)
    }
}
