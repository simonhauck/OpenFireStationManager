package io.github.simonhauck.openfirestationmanager.clothing.inventoryreconciliation

import io.github.simonhauck.openfirestationmanager.clothing.item.ClothingItem
import io.github.simonhauck.openfirestationmanager.clothing.item.ClothingItemRepository
import io.github.simonhauck.openfirestationmanager.clothing.item.ClothingItemResolver
import io.github.simonhauck.openfirestationmanager.clothing.item.ResolvedClothingItem
import io.github.simonhauck.openfirestationmanager.clothing.location.ClothingLocation
import io.github.simonhauck.openfirestationmanager.clothing.location.ClothingLocationRepository
import io.github.simonhauck.openfirestationmanager.clothing.movement.ClothingMovement
import io.github.simonhauck.openfirestationmanager.clothing.movement.MovementReason
import io.github.simonhauck.openfirestationmanager.clothing.movement.MovementService
import io.github.simonhauck.openfirestationmanager.common.PublicApiException
import java.util.UUID
import org.springframework.data.jdbc.core.mapping.AggregateReference
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class InventoryReconciliationService(
    private val itemRepository: ClothingItemRepository,
    private val movementService: MovementService,
    private val clothingLocationRepository: ClothingLocationRepository,
    private val itemResolver: ClothingItemResolver,
) {

    fun preview(
        locationId: Long,
        request: InventoryReconciliationPreviewRequest,
    ): InventoryReconciliationPreviewResponse {
        val location = getLocationOrThrow(locationId)

        val itemsAtLocation =
            itemRepository
                .findAllByLocationId(location.getIdAsReference())
                .associateBy { it.id }

        val scannedItemIds = request.scannedItemIds.toSet()
        val unchanged: MutableList<ResolvedClothingItem> = mutableListOf()
        val found: MutableList<ResolvedClothingItem> = mutableListOf()
        val missing: MutableList<ResolvedClothingItem> = mutableListOf()

        for (scannedId in scannedItemIds) {
            val resolved = itemResolver.resolveOne(scannedId)
            if (resolved.clothingItem.locationId?.id == locationId) {
                unchanged.add(resolved)
            } else {
                found.add(resolved)
            }
        }

        for ((itemId) in itemsAtLocation) {
            if (itemId !in scannedItemIds) {
                val resolved = itemResolver.resolveOne(itemId)
                missing.add(resolved)
            }
        }

        return InventoryReconciliationPreviewResponse(
            unchangedItems = unchanged,
            foundItems = found,
            missingItems = missing,
        )
    }

    @Transactional
    fun execute(
        locationId: Long,
        request: InventoryReconciliationPreviewResponse,
    ): InventoryReconciliationExecuteResponse {
        val location = getLocationOrThrow(locationId)
        val batchId = UUID.randomUUID().toString()

        val foundMovements =
            request.foundItems.map { resolved ->
                val item = getClothingItemOrThrow(resolved.clothingItem.id)
                ClothingMovement(
                    item.getIdAsReference(),
                    item.locationId,
                    location.getIdAsReference(),
                    MovementReason.INVENTORY_RECONCILIATION,
                    batchId,
                )
            }

        val missingMovements =
            request.missingItems.map { resolved ->
                val item = getClothingItemOrThrow(resolved.clothingItem.id)
                ClothingMovement(
                    item.getIdAsReference(),
                    location.getIdAsReference(),
                    null,
                    MovementReason.INVENTORY_RECONCILIATION,
                    batchId,
                )
            }

        val allMovements = foundMovements + missingMovements
        if (allMovements.isNotEmpty()) {
            movementService.recordMovements(allMovements)
        }

        if (request.foundItems.isNotEmpty()) {
            val foundUpdates =
                request.foundItems.map { resolved ->
                    val item = getClothingItemOrThrow(resolved.clothingItem.id)
                    item.copy(locationId = location.getIdAsReference())
                }
            itemRepository.saveAll(foundUpdates)
        }

        if (request.missingItems.isNotEmpty()) {
            val missingUpdates =
                request.missingItems.map { resolved ->
                    val item = getClothingItemOrThrow(resolved.clothingItem.id)
                    item.copy(locationId = null)
                }
            itemRepository.saveAll(missingUpdates)
        }

        return InventoryReconciliationExecuteResponse(
            batchId = batchId,
            foundItemsCount = request.foundItems.size,
            missingItemsCount = request.missingItems.size,
            unchangedItemsCount = request.unchangedItems.size,
        )
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
