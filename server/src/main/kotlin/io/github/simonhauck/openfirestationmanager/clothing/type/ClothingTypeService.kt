package io.github.simonhauck.openfirestationmanager.clothing.type

import io.github.simonhauck.openfirestationmanager.common.NotFoundException
import org.springframework.stereotype.Service

@Service
class ClothingTypeService(private val repository: ClothingTypeRepository) {

    fun getAllTypes(): List<ClothingType> = repository.findAll().sortedBy { it.id }

    fun getTypeById(id: Long): ClothingType = findOrThrow(id)

    fun createType(request: CreateOrUpdateClothingTypeRequest): ClothingType {
        val entity = ClothingType(name = request.name)
        return repository.save(entity)
    }

    fun updateType(id: Long, request: CreateOrUpdateClothingTypeRequest): ClothingType {
        val existing = findOrThrow(id)
        return repository.save(existing.copy(name = request.name))
    }

    fun deleteType(id: Long) {
        findOrThrow(id)
        repository.deleteById(id)
    }

    private fun findOrThrow(id: Long): ClothingType {
        return repository.findById(id)
            ?: throw NotFoundException("Protective clothing type not found for id: $id")
    }
}
