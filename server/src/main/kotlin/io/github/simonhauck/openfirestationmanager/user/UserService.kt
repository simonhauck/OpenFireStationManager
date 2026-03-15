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
    fun getAllUsers(): List<UserAccount> = userRepository.findAll().sortedBy { it.id }

    fun getUserById(userId: Long): UserAccount {
        return userRepository.findById(userId)
            ?: throw PublicApiException(
                status = HttpStatus.NOT_FOUND,
                publicMessage = "User not found for id: $userId",
            )
    }

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
                firstName = createUserRequest.firstName,
                lastName = createUserRequest.lastName,
                roles = createUserRequest.roles,
            )

        return userRepository.save(entity)
    }

    fun updateUser(userId: Long, updateUserRequest: UpdateUserRequest): UserAccount {
        val existingUser =
            userRepository.findById(userId)
                ?: throw PublicApiException(
                    status = HttpStatus.NOT_FOUND,
                    publicMessage = "User not found for id: $userId",
                )

        val updatedUser =
            existingUser.copy(
                firstName = updateUserRequest.firstName,
                lastName = updateUserRequest.lastName,
                roles = updateUserRequest.roles,
            )

        return userRepository.save(updatedUser)
    }

    fun changePassword(userId: Long, changePasswordRequest: ChangePasswordRequest): UserAccount {
        val existingUser =
            userRepository.findById(userId)
                ?: throw PublicApiException(
                    status = HttpStatus.NOT_FOUND,
                    publicMessage = "User not found for id: $userId",
                )

        val newPasswordHash =
            passwordEncoder.encode(changePasswordRequest.newPassword)
                ?: error("Failed to encode password")

        return userRepository.save(existingUser.copy(passwordHash = newPasswordHash))
    }

    fun findByUsername(username: String): UserAccount? = userRepository.findByUsername(username)

    fun hasAnyUsers(): Boolean = userRepository.count() > 0
}
