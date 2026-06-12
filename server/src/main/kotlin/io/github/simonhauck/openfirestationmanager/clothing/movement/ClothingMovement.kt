package io.github.simonhauck.openfirestationmanager.clothing.movement

import io.github.simonhauck.openfirestationmanager.clothing.item.ClothingItem
import io.github.simonhauck.openfirestationmanager.clothing.location.ClothingLocation
import io.github.simonhauck.openfirestationmanager.db.BaseEntity
import io.github.simonhauck.openfirestationmanager.db.EntityMetaData
import org.springframework.data.annotation.Id
import org.springframework.data.jdbc.core.mapping.AggregateReference
import org.springframework.data.relational.core.mapping.Embedded
import org.springframework.data.relational.core.mapping.Table

enum class MovementReason {
    CHECKOUT,
    RETURN,
    MANUAL_CORRECTION,
    INITIAL_PLACEMENT,
    RELOCATION,
    INVENTORY_RECONCILIATION,
}

@Table("clothing_movements")
data class ClothingMovement(
    val itemId: AggregateReference<ClothingItem, Long>,
    val fromLocationId: AggregateReference<ClothingLocation, Long>?,
    val toLocationId: AggregateReference<ClothingLocation, Long>?,
    val reason: MovementReason,
    val batchId: String? = null,
    @Id override val id: Long = 0,
    @Embedded.Nullable override val metaData: EntityMetaData = EntityMetaData(),
) : BaseEntity<ClothingMovement> {
    override fun copyWithMetaData(metaData: EntityMetaData): BaseEntity<ClothingMovement> {
        return copy(metaData = metaData)
    }
}
