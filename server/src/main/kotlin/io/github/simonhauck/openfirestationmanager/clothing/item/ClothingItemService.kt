package io.github.simonhauck.openfirestationmanager.clothing.item

import io.github.simonhauck.openfirestationmanager.clothing.movement.MovementReason
import io.github.simonhauck.openfirestationmanager.clothing.movement.MovementService
import io.github.simonhauck.openfirestationmanager.common.ConflictException
import io.github.simonhauck.openfirestationmanager.common.NotFoundException
import org.springframework.data.jdbc.core.mapping.AggregateReference
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class ClothingItemService(
    private val repository: ClothingItemRepository,
    private val movementService: MovementService,
) {

    fun getAllItems(): List<ClothingItem> = repository.findAll().sortedBy { it.id }

    fun getItemById(id: Long): ClothingItem = findOrThrow(id)

    @Transactional
    fun createItem(request: CreateOrUpdateClothingItemRequest): ClothingItem {
        checkBarcodesNotAlreadyKnown(listOfNotNull(request.barcodeSanitized()))

        val entity =
            ClothingItem(
                typeId = AggregateReference.to(request.typeId),
                size = request.size,
                barcode = request.barcodeSanitized(),
                locationId = request.locationId,
            )
        val saved = repository.save(entity)

        val toLocationId = request.locationId?.id
        if (toLocationId != null) {
            movementService.recordMovement(
                item = saved,
                fromLocationId = null,
                toLocationId = toLocationId,
                reason = MovementReason.INITIAL_PLACEMENT,
            )
        }

        return saved
    }

    @Transactional
    fun createBatchItems(requests: List<CreateOrUpdateClothingItemRequest>): List<ClothingItem> {
        val barcodes = requests.mapNotNull { it.barcodeSanitized() }

        checkNoDuplicateBarcodesProvided(barcodes)

        checkBarcodesNotAlreadyKnown(barcodes)

        val entities =
            requests.map { req ->
                ClothingItem(
                    typeId = AggregateReference.to(req.typeId),
                    size = req.size,
                    barcode = req.barcodeSanitized(),
                    locationId = req.locationId,
                )
            }
        val saved = repository.saveAll(entities)

        val batchId = java.util.UUID.randomUUID().toString()

        saved.zip(requests).forEach { (item, req) ->
            val toLocationId = req.locationId?.id
            if (toLocationId != null) {
                movementService.recordMovement(
                    item = item,
                    fromLocationId = null,
                    toLocationId = toLocationId,
                    reason = MovementReason.INITIAL_PLACEMENT,
                    batchId = batchId,
                )
            }
        }

        return saved
    }

    @Transactional
    fun updateItem(id: Long, request: CreateOrUpdateClothingItemRequest): ClothingItem {
        val existing = findOrThrow(id)
        checkBarcodeUnique(request.barcodeSanitized(), excludeId = id)
        val updated =
            repository.save(
                existing.copy(
                    typeId = AggregateReference.to(request.typeId),
                    size = request.size,
                    barcode = request.barcodeSanitized(),
                    locationId = request.locationId,
                )
            )

        val oldLocationId = existing.locationId?.id
        val newLocationId = request.locationId?.id
        if (oldLocationId != newLocationId && newLocationId != null) {
            val reason =
                if (oldLocationId == null) MovementReason.INITIAL_PLACEMENT
                else MovementReason.MANUAL_CORRECTION
            movementService.recordMovement(
                item = updated,
                fromLocationId = oldLocationId,
                toLocationId = newLocationId,
                reason = reason,
            )
        }

        return updated
    }

    fun deleteItem(id: Long) {
        findOrThrow(id)
        repository.deleteById(id)
    }

    private fun findOrThrow(id: Long): ClothingItem {
        return repository.findById(id)
            ?: throw NotFoundException("Clothing item not found for id: $id")
    }

    private fun checkBarcodeUnique(barcode: String?, excludeId: Long?) {
        if (barcode == null) return
        val existing = repository.findByBarcode(barcode)
        if (existing != null && existing.id != excludeId) {
            throw ConflictException("Barcode '$barcode' is already in use")
        }
    }

    private fun checkBarcodesNotAlreadyKnown(barcodes: List<String>) {
        val existingBarcodes = repository.findAll().asSequence().mapNotNull { it.barcode }.toSet()

        val duplicates = barcodes.toSet().intersect(existingBarcodes)
        if (duplicates.isNotEmpty()) {
            throw ConflictException(
                "Die folgenden Barcodes sind bereits in Verwendung: ${duplicates.joinToString(", ")}"
            )
        }
    }

    private fun checkNoDuplicateBarcodesProvided(barcodes: List<String>) {
        require(barcodes.size == barcodes.toSet().size) {
            throw ConflictException(publicMessage = "Barcodes sind nicht eindeutig")
        }
    }
}
