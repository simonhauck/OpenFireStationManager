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
        checkUserIdentifierUnique(request.userIdentifier, excludeId = null)
        val entity =
            ClothingItem(
                typeId = AggregateReference.to(request.typeId),
                size = request.size,
                userIdentifier = request.userIdentifier,
            )
        return repository.save(entity)
    }

    @Transactional
    fun createBatchItems(requests: List<CreateOrUpdateClothingItemRequest>): List<ClothingItem> {
        val identifiers =
            requests
                .mapNotNull { it.userIdentifier }
                .also { ids ->
                    val duplicates = ids.groupingBy { it }.eachCount().filter { it.value > 1 }.keys
                    if (duplicates.isNotEmpty()) {
                        throw ConflictException(
                            "Duplicate user identifiers in batch: ${duplicates.joinToString()}"
                        )
                    }
                }
        identifiers.forEach { id -> checkUserIdentifierUnique(id, excludeId = null) }
        return requests.map { createItem(it) }
    }

    fun updateItem(id: Long, request: CreateOrUpdateClothingItemRequest): ClothingItem {
        val existing = findOrThrow(id)
        checkUserIdentifierUnique(request.userIdentifier, excludeId = id)
        return repository.save(
            existing.copy(
                typeId = AggregateReference.to(request.typeId),
                size = request.size,
                userIdentifier = request.userIdentifier,
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

    private fun checkUserIdentifierUnique(userIdentifier: String?, excludeId: Long?) {
        if (userIdentifier == null) return
        val existing = repository.findByUserIdentifier(userIdentifier)
        if (existing != null && existing.id != excludeId) {
            throw ConflictException("User identifier '$userIdentifier' is already in use")
        }
    }
}
