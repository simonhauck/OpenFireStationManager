package io.github.simonhauck.openfirestationmanager.clothing.movement

import io.github.simonhauck.openfirestationmanager.clothing.item.ClothingItem
import org.springframework.data.jdbc.core.mapping.AggregateReference
import org.springframework.stereotype.Service

@Service
class MovementService(private val repository: ClothingMovementRepository) {

    fun recordMovement(
        item: ClothingItem,
        fromLocationId: Long?,
        toLocationId: Long?,
        reason: MovementReason,
        // TODO 01.05.26 - Simon.Hauck check if this is really required
        batchId: String? = null,
    ): ClothingMovement {
        val movement =
            ClothingMovement(
                itemId = AggregateReference.to(item.id),
                fromLocationId = fromLocationId?.let { AggregateReference.to(it) },
                toLocationId = toLocationId?.let { AggregateReference.to(it) },
                reason = reason,
                batchId = batchId,
            )
        return repository.save(movement)
    }

    fun recordMovements(movements: List<ClothingMovement>): List<ClothingMovement> {
        return repository.saveAll(movements)
    }

    fun getMovementsForItem(itemId: Long): List<ClothingMovement> {
        return repository.findAllByItemId(AggregateReference.to(itemId))
    }
}
