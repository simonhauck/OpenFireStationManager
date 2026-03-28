package io.github.simonhauck.openfirestationmanager.clothing.type

import org.springframework.data.repository.Repository

interface ClothingTypeRepository : Repository<ClothingType, Long> {

    fun save(clothingType: ClothingType): ClothingType

    fun findAll(): List<ClothingType>

    fun findById(id: Long): ClothingType?

    fun deleteById(id: Long)
}
