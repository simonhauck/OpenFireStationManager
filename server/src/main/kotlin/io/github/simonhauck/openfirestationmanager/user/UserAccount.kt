package io.github.simonhauck.openfirestationmanager.user

import com.fasterxml.jackson.annotation.JsonIgnore
import io.github.simonhauck.openfirestationmanager.db.BaseEntity
import io.github.simonhauck.openfirestationmanager.db.EntityMetaData
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size
import org.springframework.data.annotation.Id
import org.springframework.data.relational.core.mapping.Embedded
import org.springframework.data.relational.core.mapping.Table

enum class UserRole {
    USER,
    ADMIN,
    GERAETEWART,
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

data class ChangePasswordRequest(
    @field:NotBlank @field:Size(min = 4, max = 32) val newPassword: String,
)

@Table("users")
data class UserAccount(
    val username: String,
    @field:JsonIgnore val passwordHash: String = "",
    val firstName: String,
    val lastName: String,
    val roles: List<UserRole> = emptyList(),
    val enabled: Boolean = true,
    @Id override val id: Long = 0,
    @Embedded.Nullable override val metaData: EntityMetaData = EntityMetaData(),
) : BaseEntity {
    override fun copyWithMetaData(metaData: EntityMetaData): BaseEntity {
        return copy(metaData = metaData)
    }
}
