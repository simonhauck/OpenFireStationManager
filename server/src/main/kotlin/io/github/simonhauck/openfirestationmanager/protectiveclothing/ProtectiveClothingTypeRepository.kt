package io.github.simonhauck.openfirestationmanager.protectiveclothing

import org.springframework.data.repository.Repository

interface ProtectiveClothingTypeRepository : Repository<ProtectiveClothingType, Long> {

    fun save(protectiveClothingType: ProtectiveClothingType): ProtectiveClothingType

    fun findAll(): List<ProtectiveClothingType>

    fun findById(id: Long): ProtectiveClothingType?

    fun deleteById(id: Long)
}
