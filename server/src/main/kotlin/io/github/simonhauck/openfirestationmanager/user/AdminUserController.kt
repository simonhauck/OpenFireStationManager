package io.github.simonhauck.openfirestationmanager.user

import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.validation.annotation.Validated
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/admin/users")
@Validated
class AdminUserController(private val userService: UserService) {

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    //    @PreAuthorize("hasRole('ROLE_ADMIN')")
    fun createUser(@Valid @RequestBody requestBody: CreateUserRequest): UserAccount {
        return userService.createUser(requestBody)
    }
}
