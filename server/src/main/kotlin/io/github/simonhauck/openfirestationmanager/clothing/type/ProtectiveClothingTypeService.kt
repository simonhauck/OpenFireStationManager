package io.github.simonhauck.openfirestationmanager.clothing.type

import io.github.simonhauck.openfirestationmanager.common.PublicApiException
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service

@Service
class ProtectiveClothingTypeService(private val repository: ProtectiveClothingTypeRepository) {

    fun getAllTypes(): List<ProtectiveClothingType> = repository.findAll().sortedBy { it.id }

    fun getTypeById(id: Long): ProtectiveClothingType = findOrThrow(id)

    fun createType(request: CreateProtectiveClothingTypeRequest): ProtectiveClothingType {
        val entity = ProtectiveClothingType(name = request.name)
        return repository.save(entity)
    }

    fun updateType(id: Long, request: UpdateProtectiveClothingTypeRequest): ProtectiveClothingType {
        val existing = findOrThrow(id)
        return repository.save(existing.copy(name = request.name))
    }

    fun deleteType(id: Long) {
        findOrThrow(id)
        repository.deleteById(id)
    }

    private fun findOrThrow(id: Long): ProtectiveClothingType {
        return repository.findById(id)
            ?: throw PublicApiException(
                status = HttpStatus.NOT_FOUND,
                publicMessage = "Protective clothing type not found for id: $id",
            )
    }
}
