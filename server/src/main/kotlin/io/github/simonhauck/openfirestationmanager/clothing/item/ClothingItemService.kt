package io.github.simonhauck.openfirestationmanager.clothing.item

import io.github.simonhauck.openfirestationmanager.clothing.type.ClothingTypeRepository
import io.github.simonhauck.openfirestationmanager.common.ConflictException
import io.github.simonhauck.openfirestationmanager.common.NotFoundException
import org.springframework.data.jdbc.core.mapping.AggregateReference
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class ClothingItemService(
    private val repository: ClothingItemRepository,
    private val clothingTypeRepository: ClothingTypeRepository,
) {

    fun getAllItems(): List<ClothingItem> = repository.findAll().sortedBy { it.id }

    fun getItemById(id: Long): ClothingItem = findOrThrow(id)

    fun getSummaryByTypeAndSize(): List<ClothingTypeSizeSummary> {
        val items = repository.findAll()
        return clothingTypeRepository
            .findAll()
            .sortedBy { it.id }
            .map { type ->
                val sizeCounts =
                    items
                        .asSequence()
                        .filter { item -> item.typeId.id == type.id }
                        .groupingBy { item -> item.size }
                        .eachCount()
                        .mapValues { (_, count) -> count.toLong() }
                        .toSortedMap()

                ClothingTypeSizeSummary(
                    typeId = type.id,
                    typeName = type.name,
                    sizeCounts = sizeCounts,
                )
            }
    }

    fun createItem(request: CreateOrUpdateClothingItemRequest): ClothingItem {
        checkBarcodesNotAlreadyKnown(listOfNotNull(request.barcodeSanitized()))

        val entity =
            ClothingItem(
                typeId = AggregateReference.to(request.typeId),
                size = request.size,
                barcode = request.barcode,
            )
        return repository.save(entity)
    }

    @Transactional
    fun createBatchItems(requests: List<CreateOrUpdateClothingItemRequest>): List<ClothingItem> {
        val barcodes = requests.mapNotNull { it.barcodeSanitized() }

        checkNoDuplicateBarcodesProvided(barcodes)

        checkBarcodesNotAlreadyKnown(barcodes)

        val entities = requests.map { req ->
            ClothingItem(
                typeId = AggregateReference.to(req.typeId),
                size = req.size,
                barcode = req.barcodeSanitized(),
            )
        }
        return repository.saveAll(entities)
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

    fun updateItem(id: Long, request: CreateOrUpdateClothingItemRequest): ClothingItem {
        val existing = findOrThrow(id)
        checkBarcodeUnique(request.barcode, excludeId = id)
        return repository.save(
            existing.copy(
                typeId = AggregateReference.to(request.typeId),
                size = request.size,
                barcode = request.barcode,
            )
        )
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
}
