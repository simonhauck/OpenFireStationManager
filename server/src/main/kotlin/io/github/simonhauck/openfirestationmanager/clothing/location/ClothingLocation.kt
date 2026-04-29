package io.github.simonhauck.openfirestationmanager.clothing.location

import io.github.simonhauck.openfirestationmanager.db.BaseEntity
import io.github.simonhauck.openfirestationmanager.db.EntityMetaData
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotNull
import jakarta.validation.constraints.Size
import org.springframework.data.annotation.Id
import org.springframework.data.relational.core.mapping.Embedded
import org.springframework.data.relational.core.mapping.Table

enum class LocationType {
    POOL,
    WAESCHE,
    PERSONAL,
    OTHER,
}

data class CreateClothingLocationRequest(
    @NotBlank @Size(max = 255) val name: String,
    @Size(max = 255) val comment: String,
    val onlyVisibleForKleiderwart: Boolean,
    @NotNull val type: LocationType,
)

data class BatchCreateClothingLocationsRequest(val items: List<CreateClothingLocationRequest>)

@Table("clothing_locations")
data class ClothingLocation(
    val name: String,
    val comment: String,
    val onlyVisibleForKleiderwart: Boolean,
    val type: LocationType,
    @Id override val id: Long = 0,
    @Embedded.Nullable override val metaData: EntityMetaData = EntityMetaData(),
) : BaseEntity<ClothingLocation> {
    override fun copyWithMetaData(metaData: EntityMetaData): BaseEntity<ClothingLocation> {
        return copy(metaData = metaData)
    }
}
