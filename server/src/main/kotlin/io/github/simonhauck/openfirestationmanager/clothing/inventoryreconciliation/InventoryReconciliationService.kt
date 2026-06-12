package io.github.simonhauck.openfirestationmanager.clothing.inventoryreconciliation

import io.github.simonhauck.openfirestationmanager.clothing.item.ClothingItem
import io.github.simonhauck.openfirestationmanager.clothing.item.ClothingItemRepository
import io.github.simonhauck.openfirestationmanager.clothing.item.ResolvedClothingItem
import io.github.simonhauck.openfirestationmanager.clothing.location.ClothingLocation
import io.github.simonhauck.openfirestationmanager.clothing.location.ClothingLocationRepository
import io.github.simonhauck.openfirestationmanager.clothing.movement.ClothingMovement
import io.github.simonhauck.openfirestationmanager.clothing.movement.MovementReason
import io.github.simonhauck.openfirestationmanager.clothing.movement.MovementService
import io.github.simonhauck.openfirestationmanager.clothing.type.ClothingType
import io.github.simonhauck.openfirestationmanager.clothing.type.ClothingTypeRepository
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
    private val typeRepository: ClothingTypeRepository,
) {

    fun preview(
        locationId: Long,
        request: InventoryReconciliationPreviewRequest,
    ): InventoryReconciliationPreviewResponse {
        val location = getLocationOrThrow(locationId)
        val types = typeRepository.findAll().associateBy { it.id }
        val locations = clothingLocationRepository.findAll().associateBy { it.id }

        val itemsAtLocation =
            itemRepository.findAllByLocationId(AggregateReference.to(locationId)).associateBy {
                it.id
            }

        val scannedItemIds = request.scannedItemIds.toSet()
        val unchanged: MutableList<ResolvedClothingItem> = mutableListOf()
        val found: MutableList<ResolvedClothingItem> = mutableListOf()
        val missing: MutableList<ResolvedClothingItem> = mutableListOf()

        for (scannedId in scannedItemIds) {
            val item =
                itemRepository.findById(scannedId)
                    ?: throw PublicApiException(
                        HttpStatus.NOT_FOUND,
                        "Item with id $scannedId not found",
                    )
            val resolved = resolveItem(item, types, locations)
            if (item.locationId?.id == locationId) {
                unchanged.add(resolved)
            } else {
                found.add(resolved)
            }
        }

        for ((itemId, item) in itemsAtLocation) {
            if (itemId !in scannedItemIds) {
                val resolved = resolveItem(item, types, locations)
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

    private fun resolveItem(
        item: ClothingItem,
        types: Map<Long, ClothingType>,
        locations: Map<Long, ClothingLocation>,
    ): ResolvedClothingItem {
        val location = item.locationId?.id?.let { locations[it] }
        val type =
            types[item.typeId.id]
                ?: throw PublicApiException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "Type not found for item ${item.id}",
                )
        return ResolvedClothingItem(clothingItem = item, location = location, clothingType = type)
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
