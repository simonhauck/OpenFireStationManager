package io.github.simonhauck.openfirestationmanager.clothing.item

import io.github.simonhauck.openfirestationmanager.common.NotFoundException
import org.springframework.data.jdbc.core.mapping.AggregateReference
import org.springframework.stereotype.Service

@Service
class ClothingItemService(private val repository: ClothingItemRepository) {

    fun getAllItems(): List<ClothingItem> = repository.findAll().sortedBy { it.id }

    fun getItemById(id: Long): ClothingItem = findOrThrow(id)

    fun createItem(request: CreateOrUpdateClothingItemRequest): ClothingItem {
        val entity =
            ClothingItem(typeId = AggregateReference.to(request.typeId), size = request.size)
        return repository.save(entity)
    }

    fun updateItem(id: Long, request: CreateOrUpdateClothingItemRequest): ClothingItem {
        val existing = findOrThrow(id)
        return repository.save(
            existing.copy(typeId = AggregateReference.to(request.typeId), size = request.size)
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
