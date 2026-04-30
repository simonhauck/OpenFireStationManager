package io.github.simonhauck.openfirestationmanager.clothing.movement

import io.github.simonhauck.openfirestationmanager.clothing.item.ClothingItem
import org.springframework.data.jdbc.core.mapping.AggregateReference
import org.springframework.data.repository.Repository

interface ClothingMovementRepository : Repository<ClothingMovement, Long> {

    fun save(movement: ClothingMovement): ClothingMovement

    fun saveAll(movements: Iterable<ClothingMovement>): List<ClothingMovement>

    fun findAllByItemId(itemId: AggregateReference<ClothingItem, Long>): List<ClothingMovement>
}
