package io.github.simonhauck.openfirestationmanager.clothing.movement

import io.github.simonhauck.openfirestationmanager.clothing.item.ClothingItem
import io.github.simonhauck.openfirestationmanager.clothing.location.ClothingLocation
import org.springframework.data.jdbc.core.mapping.AggregateReference
import org.springframework.stereotype.Service

@Service
class MovementService(private val repository: ClothingMovementRepository) {

    fun recordMovement(
        item: ClothingItem,
        fromLocationId: Long?,
        toLocationId: Long?,
        reason: MovementReason,
        batchId: String? = null,
    ): ClothingMovement {
        val movement =
            ClothingMovement(
                itemId = AggregateReference.to(item.id),
                fromLocationId =
                    fromLocationId?.let { AggregateReference.to<ClothingLocation, Long>(it) },
                toLocationId =
                    toLocationId?.let { AggregateReference.to<ClothingLocation, Long>(it) },
                reason = reason,
                batchId = batchId,
            )
        return repository.save(movement)
    }

    fun getMovementsForItem(itemId: Long): List<ClothingMovement> {
        return repository.findAllByItemId(AggregateReference.to(itemId))
    }
}
