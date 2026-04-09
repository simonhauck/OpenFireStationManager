package io.github.simonhauck.openfirestationmanager.clothing.item

import io.github.simonhauck.openfirestationmanager.clothing.type.ClothingTypeRepository
import io.github.simonhauck.openfirestationmanager.common.NotFoundException
import org.springframework.data.jdbc.core.mapping.AggregateReference
import org.springframework.stereotype.Service

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
        val entity =
            ClothingItem(
                typeId = AggregateReference.to(request.typeId),
                size = request.size,
                locationId = request.locationId?.let { AggregateReference.to(it) },
            )
        return repository.save(entity)
    }

    fun updateItem(id: Long, request: CreateOrUpdateClothingItemRequest): ClothingItem {
        val existing = findOrThrow(id)
        return repository.save(
            existing.copy(
                typeId = AggregateReference.to(request.typeId),
                size = request.size,
                locationId = request.locationId?.let { AggregateReference.to(it) },
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
}
