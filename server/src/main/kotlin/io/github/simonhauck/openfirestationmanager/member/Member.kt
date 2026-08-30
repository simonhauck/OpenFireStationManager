package io.github.simonhauck.openfirestationmanager.member

import io.github.simonhauck.openfirestationmanager.db.BaseEntity
import io.github.simonhauck.openfirestationmanager.db.EntityMetaData
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size
import org.springframework.data.annotation.Id
import org.springframework.data.relational.core.mapping.Embedded
import org.springframework.data.relational.core.mapping.Table

data class CreateOrUpdateMemberRequest(@NotBlank @Size(max = 255) val name: String)

@Table("members")
data class Member(
    val name: String,
    @Id override val id: Long = 0,
    @Embedded.Nullable override val metaData: EntityMetaData = EntityMetaData(),
) : BaseEntity<Member> {
    override fun copyWithMetaData(metaData: EntityMetaData): BaseEntity<Member> {
        return copy(metaData = metaData)
    }
}
