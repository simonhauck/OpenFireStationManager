package io.github.simonhauck.openfirestationmanager.user

import io.github.simonhauck.openfirestationmanager.common.PublicApiException
import org.springframework.http.HttpStatus
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.stereotype.Service

@Service
class UserService(
    private val userRepository: UserRepository,
    private val passwordEncoder: PasswordEncoder,
) {
    fun createUser(createUserRequest: CreateUserRequest): UserAccount {
        if (userRepository.existsByUsername(createUserRequest.username)) {
            throw PublicApiException(status = HttpStatus.CONFLICT, "Username is already taken")
        }

        val passwordHash =
            passwordEncoder.encode(createUserRequest.password) ?: error("Failed to encode password")

        val entity =
            UserAccount(
                username = createUserRequest.username,
                passwordHash = passwordHash,
                roles = createUserRequest.roles,
            )

        return userRepository.save(entity)
    }

    fun findByUsername(username: String): UserAccount? = userRepository.findByUsername(username)

    fun hasAnyUsers(): Boolean = userRepository.count() > 0
}
