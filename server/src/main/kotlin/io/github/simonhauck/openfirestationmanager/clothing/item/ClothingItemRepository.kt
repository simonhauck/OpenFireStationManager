package io.github.simonhauck.openfirestationmanager.clothing.item

import org.springframework.data.repository.Repository

interface ClothingItemRepository : Repository<ClothingItem, Long> {

    fun save(clothingItem: ClothingItem): ClothingItem

    fun findAll(): List<ClothingItem>

    fun findById(id: Long): ClothingItem?

    fun deleteById(id: Long)
}
