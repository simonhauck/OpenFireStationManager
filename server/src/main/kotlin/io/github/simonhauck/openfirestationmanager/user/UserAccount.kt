package io.github.simonhauck.openfirestationmanager.user

import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size
import java.time.Instant
import org.springframework.data.annotation.Id
import org.springframework.data.relational.core.mapping.Table

enum class UserRole {
    USER,
    ADMIN,
}

data class CreateUserRequest(
    @field:NotBlank val username: String,
    @field:NotBlank @field:Size(min = 4, max = 32) val password: String,
    @field:NotBlank @field:Size(max = 100) val firstName: String,
    @field:NotBlank @field:Size(max = 100) val lastName: String,
    val roles: List<UserRole> = emptyList(),
)

data class UpdateUserRequest(
    @field:NotBlank @field:Size(max = 100) val firstName: String,
    @field:NotBlank @field:Size(max = 100) val lastName: String,
    val roles: List<UserRole> = emptyList(),
)

@Table("users")
data class UserAccount(
    @Id val id: Long = 0,
    val username: String,
    val passwordHash: String,
    val firstName: String,
    val lastName: String,
    val roles: List<UserRole> = emptyList(),
    val enabled: Boolean = true,
    val createdAt: Instant = Instant.now(),
)
