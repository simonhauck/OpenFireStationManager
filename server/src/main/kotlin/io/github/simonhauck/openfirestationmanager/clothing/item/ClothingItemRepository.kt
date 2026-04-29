package io.github.simonhauck.openfirestationmanager.clothing.item

import io.github.simonhauck.openfirestationmanager.clothing.location.ClothingLocation
import io.github.simonhauck.openfirestationmanager.clothing.type.ClothingType
import org.springframework.data.jdbc.core.mapping.AggregateReference
import org.springframework.data.repository.Repository

interface ClothingItemRepository : Repository<ClothingItem, Long> {

    fun save(clothingItem: ClothingItem): ClothingItem

    fun saveAll(clothingItems: Iterable<ClothingItem>): List<ClothingItem>

    fun findAll(): List<ClothingItem>

    fun findAllByTypeIdAndLocationId(
        typeId: AggregateReference<ClothingType, Long>,
        locationId: AggregateReference<ClothingLocation, Long>,
    ): List<ClothingItem>

    fun findAllByTypeId(typeId: AggregateReference<ClothingType, Long>): List<ClothingItem>

    fun findById(id: Long): ClothingItem?

    fun findByBarcode(barcode: String): ClothingItem?

    fun deleteById(id: Long)
}
