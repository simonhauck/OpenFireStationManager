package io.github.simonhauck.openfirestationmanager.usermanagement

import com.fasterxml.jackson.annotation.JsonIgnore
import io.github.simonhauck.openfirestationmanager.db.BaseEntity
import io.github.simonhauck.openfirestationmanager.db.EntityMetaData
import io.swagger.v3.oas.annotations.media.Schema
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size
import org.springframework.data.annotation.Id
import org.springframework.data.relational.core.mapping.Embedded
import org.springframework.data.relational.core.mapping.Table

@Schema(
    description =
        """
        What an account is allowed to do. Roles are cumulative in effect, not exclusive:

        - `USER` — read clothing data, and check garments out and back in.
        - `KLEIDERWART` — the quartermaster. Additionally create, update, and delete clothing
          types, items, and locations, run relocations and stock-takes, and see locations
          flagged `onlyVisibleForKleiderwart`.
        - `ADMIN` — implicitly granted every other role, so an admin can call every endpoint in
          this API. Additionally manages user accounts and legal documents.
        """
)
enum class UserRole {
    USER,
    ADMIN,
    KLEIDERWART,
}

@Schema(description = "Details of a new user account, including its initial password.")
data class CreateUserRequest(
    @field:Schema(
        description = "Login name. Must not already be taken.",
        example = "m.mustermann",
    )
    @field:NotBlank
    val username: String,
    @field:Schema(
        description = "Initial plaintext password, between 4 and 32 characters. Stored hashed.",
        example = "correct-horse",
    )
    @field:NotBlank
    @field:Size(min = 4, max = 32)
    val password: String,
    @field:Schema(description = "Given name.", example = "Max")
    @field:NotBlank
    @field:Size(max = 100)
    val firstName: String,
    @field:Schema(description = "Family name.", example = "Mustermann")
    @field:NotBlank
    @field:Size(max = 100)
    val lastName: String,
    @field:Schema(
        description =
            "Roles to grant. An empty list creates an account that can sign in but has no " +
                "permissions beyond the defaults.",
        example = "[\"USER\"]",
    )
    val roles: List<UserRole> = emptyList(),
)

@Schema(
    description =
        "Replacement values for an existing account's profile and roles. The username cannot be " +
            "changed, and the password is changed through its own endpoint."
)
data class UpdateUserRequest(
    @field:Schema(description = "Given name.", example = "Max")
    @field:NotBlank
    @field:Size(max = 100)
    val firstName: String,
    @field:Schema(description = "Family name.", example = "Mustermann")
    @field:NotBlank
    @field:Size(max = 100)
    val lastName: String,
    @field:Schema(
        description =
            "The complete set of roles the account should have afterwards. This replaces the " +
                "existing roles rather than adding to them, so omitting a role revokes it.",
        example = "[\"USER\", \"KLEIDERWART\"]",
    )
    val roles: List<UserRole> = emptyList(),
)

@Schema(description = "A new password for an existing account.")
data class ChangePasswordRequest(
    @field:Schema(
        description =
            "New plaintext password, between 4 and 32 characters. The current password is not " +
                "required, because only an administrator may call this.",
        example = "correct-horse",
    )
    @field:NotBlank
    @field:Size(min = 4, max = 32)
    val newPassword: String
)

@Schema(
    description =
        "A user account. The password hash is never serialised, so it is absent from every " +
            "response."
)
@Table("users")
data class UserAccount(
    @field:Schema(description = "Login name.", example = "m.mustermann") val username: String,
    @field:JsonIgnore val passwordHash: String = "",
    @field:Schema(description = "Given name.", example = "Max") val firstName: String,
    @field:Schema(description = "Family name.", example = "Mustermann") val lastName: String,
    @field:Schema(
        description = "Roles held by this account, governing what it may call.",
        example = "[\"USER\", \"KLEIDERWART\"]",
    )
    val roles: List<UserRole> = emptyList(),
    @field:Schema(
        description = "Whether the account may sign in. Disabled accounts are rejected at login.",
        example = "true",
    )
    val enabled: Boolean = true,
    @field:Schema(description = "Server-assigned identifier.", example = "5")
    @Id
    override val id: Long = 0,
    @Embedded.Nullable override val metaData: EntityMetaData = EntityMetaData(),
) : BaseEntity<UserAccount> {
    override fun copyWithMetaData(metaData: EntityMetaData): BaseEntity<UserAccount> {
        return copy(metaData = metaData)
    }
}
