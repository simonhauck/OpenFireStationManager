package io.github.simonhauck.openfirestationmanager.clothing.item

import io.github.simonhauck.openfirestationmanager.clothing.type.ClothingType
import io.github.simonhauck.openfirestationmanager.db.BaseEntity
import io.github.simonhauck.openfirestationmanager.db.EntityMetaData
import io.swagger.v3.oas.annotations.media.Schema
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Positive
import jakarta.validation.constraints.Size
import org.springframework.data.annotation.Id
import org.springframework.data.jdbc.core.mapping.AggregateReference
import org.springframework.data.relational.core.mapping.Embedded
import org.springframework.data.relational.core.mapping.Table

data class CreateOrUpdateClothingItemRequest(
    @Positive val typeId: Long,
    @NotBlank @Size(max = 255) val size: String,
)

@Table("clothing_items")
data class ClothingItem(
    @field:Schema(type = "integer", format = "int64")
    val typeId: AggregateReference<ClothingType, Long>,
    val size: String,
    @Id override val id: Long = 0,
    @Embedded.Nullable override val metaData: EntityMetaData = EntityMetaData(),
) : BaseEntity {
    override fun copyWithMetaData(metaData: EntityMetaData): BaseEntity {
        return copy(metaData = metaData)
    }
}
