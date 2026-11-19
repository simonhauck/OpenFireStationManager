package io.github.simonhauck.openfirestationmanager.security.auth

import io.github.simonhauck.openfirestationmanager.usermanagement.CreateUserRequest
import io.github.simonhauck.openfirestationmanager.usermanagement.UserRole
import io.github.simonhauck.openfirestationmanager.usermanagement.UserService
import org.springframework.stereotype.Component

/**
 * Provides the `chief` / `secret` admin account for tests that exercise local username/password
 * login. Tests that only need an authenticated caller use a test session cookie instead.
 */
@Component
class LocalAdminFixture(private val userService: UserService) {

    fun ensureLocalAdmin() {
        if (userService.findByUsername(USERNAME) != null) return
        userService.createUser(
            CreateUserRequest(
                username = USERNAME,
                password = "secret",
                firstName = "Initial",
                lastName = "Admin",
                roles = listOf(UserRole.ADMIN),
            ),
        )
    }

    companion object {
        const val USERNAME = "chief"
    }
}
