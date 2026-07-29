package io.github.simonhauck.openfirestationmanager.clothing.relocation

import io.github.simonhauck.openfirestationmanager.clothing.item.ClothingItem
import io.github.simonhauck.openfirestationmanager.clothing.item.ClothingItemRepository
import io.github.simonhauck.openfirestationmanager.clothing.location.ClothingLocation
import io.github.simonhauck.openfirestationmanager.clothing.location.ClothingLocationRepository
import io.github.simonhauck.openfirestationmanager.clothing.movement.ClothingMovement
import io.github.simonhauck.openfirestationmanager.clothing.movement.MovementReason
import io.github.simonhauck.openfirestationmanager.clothing.movement.MovementService
import io.github.simonhauck.openfirestationmanager.common.PublicApiException
import java.util.UUID
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class RelocationService(
    private val itemRepository: ClothingItemRepository,
    private val movementService: MovementService,
    private val clothingLocationRepository: ClothingLocationRepository,
) {

    @Transactional
    fun relocate(request: RelocationRequest): List<ClothingItem> {
        val items = request.itemIds.map { id -> getClothingItemOrThrow(id) }

        val location = getLocationOrThrow(request.targetLocationId)

        val batchId = UUID.randomUUID().toString()

        val movements = items.map {
            ClothingMovement(
                it.getIdAsReference(),
                it.locationId,
                location.getIdAsReference(),
                MovementReason.RELOCATION,
                batchId,
            )
        }

        val updatedItems = items.map { it.copy(locationId = location.getIdAsReference()) }

        movementService.recordMovements(movements)
        return itemRepository.saveAll(updatedItems)
    }

    private fun getLocationOrThrow(id: Long): ClothingLocation {
        return clothingLocationRepository.findById(id)
            ?: throw PublicApiException(HttpStatus.NOT_FOUND, "Location with id $id not found")
    }

    private fun getClothingItemOrThrow(id: Long): ClothingItem {
        return itemRepository.findById(id)
            ?: throw PublicApiException(HttpStatus.NOT_FOUND, "Item with id $id not found")
    }
}
