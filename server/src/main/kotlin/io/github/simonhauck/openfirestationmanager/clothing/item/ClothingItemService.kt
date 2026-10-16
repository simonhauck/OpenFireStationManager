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

    fun getItemById(id: Long): ClothingItem = findOrThrow(id)

    @Transactional
    fun createItem(request: CreateOrUpdateClothingItemRequest): ClothingItem {
        val barcode = request.barcodeSanitized()
        val manufacturerBarcode = request.manufacturerBarcodeSanitized()
        checkNoDuplicateBarcodesProvided(listOfNotNull(barcode, manufacturerBarcode))
        checkBarcodesNotAlreadyKnown(listOfNotNull(barcode, manufacturerBarcode))

        val entity =
            ClothingItem(
                typeId = AggregateReference.to(request.typeId),
                size = request.size,
                barcode = barcode,
                manufacturerBarcode = manufacturerBarcode,
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
        val barcodes = requests.flatMap {
            listOfNotNull(it.barcodeSanitized(), it.manufacturerBarcodeSanitized())
        }

        checkNoDuplicateBarcodesProvided(barcodes)

        checkBarcodesNotAlreadyKnown(barcodes)

        val entities = requests.map { req ->
            ClothingItem(
                typeId = AggregateReference.to(req.typeId),
                size = req.size,
                barcode = req.barcodeSanitized(),
                manufacturerBarcode = req.manufacturerBarcodeSanitized(),
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
        val barcode = request.barcodeSanitized()
        val manufacturerBarcode = request.manufacturerBarcodeSanitized()
        val provided = listOfNotNull(barcode, manufacturerBarcode)
        checkNoDuplicateBarcodesProvided(provided)
        checkBarcodesNotAlreadyKnown(provided, excludeItemId = id)
        val updated =
            repository.save(
                existing.copy(
                    typeId = AggregateReference.to(request.typeId),
                    size = request.size,
                    barcode = barcode,
                    manufacturerBarcode = manufacturerBarcode,
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

    /**
     * Rejects any value already used as a station `Barcode` or a `Hersteller-Barcode` by another
     * item. The station and manufacturer columns share one value space, so a conflict is reported
     * regardless of which column the existing item stores the value in.
     */
    private fun checkBarcodesNotAlreadyKnown(barcodes: List<String>, excludeItemId: Long? = null) {
        if (barcodes.isEmpty()) return

        val existingBarcodes =
            repository
                .findAll()
                .asSequence()
                .filter { it.id != excludeItemId }
                .flatMap { sequenceOf(it.barcode, it.manufacturerBarcode) }
                .filterNotNull()
                .toSet()

        val duplicates = barcodes.toSet().intersect(existingBarcodes)
        if (duplicates.isNotEmpty()) {
            throw ConflictException(barcodesAlreadyInUseMessage(duplicates))
        }
    }

    private fun barcodeAlreadyInUseMessage(barcode: String): String =
        "Der Barcode '$barcode' ist bereits in Verwendung."

    private fun barcodesAlreadyInUseMessage(barcodes: Set<String>): String =
        when (barcodes.size) {
            1 -> barcodeAlreadyInUseMessage(barcodes.first())
            else ->
                "Die folgenden Barcodes sind bereits in Verwendung: ${barcodes.joinToString(", ")}"
        }

    private fun checkNoDuplicateBarcodesProvided(barcodes: List<String>) {
        require(barcodes.size == barcodes.toSet().size) {
            throw ConflictException(publicMessage = "Barcodes sind nicht eindeutig")
        }
    }
}
