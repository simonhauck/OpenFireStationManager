package io.github.simonhauck.openfirestationmanager.clothing.location

import io.github.simonhauck.openfirestationmanager.db.BaseEntity
import io.github.simonhauck.openfirestationmanager.db.EntityMetaData
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size
import org.springframework.data.annotation.Id
import org.springframework.data.relational.core.mapping.Embedded
import org.springframework.data.relational.core.mapping.Table

data class CreateOrUpdateClothingLocationRequest(
    @NotBlank @Size(max = 255) val name: String,
    @Size(max = 255) val comment: String = "",
    val onlyVisibleForKleiderwart: Boolean = false,
    val shouldBeShownOnDashboard: Boolean = false,
)

@Table("clothing_locations")
data class ClothingLocation(
    val name: String,
    val comment: String,
    val onlyVisibleForKleiderwart: Boolean,
    val shouldBeShownOnDashboard: Boolean,
    @Id override val id: Long = 0,
    @Embedded.Nullable override val metaData: EntityMetaData = EntityMetaData(),
) : BaseEntity {
    override fun copyWithMetaData(metaData: EntityMetaData): BaseEntity {
        return copy(metaData = metaData)
    }
}
