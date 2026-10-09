package io.github.simonhauck.openfirestationmanager.clothing.type

import org.springframework.data.jdbc.core.mapping.AggregateReference
import org.springframework.data.repository.Repository

interface ClothingTypeImageRepository : Repository<ClothingTypeImage, Long> {

    fun save(image: ClothingTypeImage): ClothingTypeImage

    fun findById(id: Long): ClothingTypeImage?

    fun findAllByTypeIdOrderByIdAsc(
        typeId: AggregateReference<ClothingType, Long>
    ): List<ClothingTypeImage>

    fun findAll(): List<ClothingTypeImage>

    fun deleteById(id: Long)
}
