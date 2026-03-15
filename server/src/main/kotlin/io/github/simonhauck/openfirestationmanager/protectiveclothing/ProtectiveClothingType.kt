package io.github.simonhauck.openfirestationmanager.protectiveclothing

import io.github.simonhauck.openfirestationmanager.db.BaseEntity
import io.github.simonhauck.openfirestationmanager.db.EntityMetaData
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size
import org.springframework.data.annotation.Id
import org.springframework.data.relational.core.mapping.Embedded
import org.springframework.data.relational.core.mapping.Table

data class CreateProtectiveClothingTypeRequest(
    @NotBlank @Size(max = 255) val name: String,
)

data class UpdateProtectiveClothingTypeRequest(
    @NotBlank @Size(max = 255) val name: String,
)

@Table("protective_clothing_types")
data class ProtectiveClothingType(
    val name: String,
    @Id override val id: Long = 0,
    @Embedded.Nullable override val metaData: EntityMetaData = EntityMetaData(),
) : BaseEntity {
    override fun copyWithMetaData(metaData: EntityMetaData): BaseEntity {
        return copy(metaData = metaData)
    }
}
