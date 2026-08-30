package io.github.simonhauck.openfirestationmanager.member

import io.github.simonhauck.openfirestationmanager.db.BaseEntity
import io.github.simonhauck.openfirestationmanager.db.EntityMetaData
import io.swagger.v3.oas.annotations.media.Schema
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size
import org.springframework.data.annotation.Id
import org.springframework.data.relational.core.mapping.Embedded
import org.springframework.data.relational.core.mapping.Table

@Schema(description = "The details of a member. Used for both creation and update.")
data class CreateOrUpdateMemberRequest(
    @field:Schema(
        description =
            "Full name of the person, as it should appear on the roster. Not required to be " +
                "unique, so two people with the same name are allowed.",
        example = "Hans Müller",
    )
    @NotBlank
    @Size(max = 255)
    val name: String
)

@Schema(
    description =
        "A person in the brigade (*Mitglied*). Deliberately distinct from a user account: a " +
            "member is a person on the roster, an account is a set of login credentials, and the " +
            "two are not linked."
)
@Table("members")
data class Member(
    @field:Schema(description = "Full name of the person.", example = "Hans Müller")
    val name: String,
    @field:Schema(description = "Server-assigned identifier.", example = "5")
    @Id
    override val id: Long = 0,
    @Embedded.Nullable override val metaData: EntityMetaData = EntityMetaData(),
) : BaseEntity<Member> {
    override fun copyWithMetaData(metaData: EntityMetaData): BaseEntity<Member> {
        return copy(metaData = metaData)
    }
}
