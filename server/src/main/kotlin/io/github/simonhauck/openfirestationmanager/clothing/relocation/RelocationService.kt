package io.github.simonhauck.openfirestationmanager.clothing.relocation

import io.github.simonhauck.openfirestationmanager.clothing.item.ClothingItemRepository
import io.github.simonhauck.openfirestationmanager.clothing.location.ClothingLocationRepository
import io.github.simonhauck.openfirestationmanager.clothing.movement.MovementReason
import io.github.simonhauck.openfirestationmanager.clothing.movement.MovementService
import io.github.simonhauck.openfirestationmanager.common.PublicApiException
import java.util.UUID
import org.springframework.data.jdbc.core.mapping.AggregateReference
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class RelocationService(
    private val itemRepository: ClothingItemRepository,
    private val locationRepository: ClothingLocationRepository,
    private val movementService: MovementService,
) {

    @Transactional
    fun relocate(request: RelocationRequest): RelocationResponse {
        locationRepository.findById(request.targetLocationId)
            ?: throw PublicApiException(HttpStatus.BAD_REQUEST, "targetLocationId not found")

        if (request.itemIds.isEmpty()) {
            throw PublicApiException(HttpStatus.BAD_REQUEST, "itemIds must not be empty")
        }

        val items = request.itemIds.map { id ->
            itemRepository.findById(id)
                ?: throw PublicApiException(HttpStatus.BAD_REQUEST, "Item with id $id not found")
        }

        val batchId = UUID.randomUUID().toString()

        for (item in items) {
            val fromLocationId = item.locationId?.id
            movementService.recordMovement(
                item = item,
                fromLocationId = fromLocationId,
                toLocationId = request.targetLocationId,
                reason = MovementReason.RELOCATION,
                batchId = batchId,
            )
            itemRepository.save(
                item.copy(locationId = AggregateReference.to(request.targetLocationId))
            )
        }

        return RelocationResponse(batchId)
    }
}
