package io.github.simonhauck.openfirestationmanager.clothing.location

import io.github.simonhauck.openfirestationmanager.common.NotFoundException
import org.springframework.stereotype.Service

@Service
class ClothingLocationService(private val repository: ClothingLocationRepository) {

    fun getAllLocations(): List<ClothingLocation> = repository.findAll().sortedBy { it.id }

    fun getLocationById(id: Long): ClothingLocation = findOrThrow(id)

    fun createLocation(request: CreateOrUpdateClothingLocationRequest): ClothingLocation {
        val entity =
            ClothingLocation(
                name = request.name,
                comment = request.comment,
                onlyVisibleForKleiderwart = request.onlyVisibleForKleiderwart,
                shouldBeShownOnDashboard = request.shouldBeShownOnDashboard,
            )
        return repository.save(entity)
    }

    fun updateLocation(id: Long, request: CreateOrUpdateClothingLocationRequest): ClothingLocation {
        val existing = findOrThrow(id)
        return repository.save(
            existing.copy(
                name = request.name,
                comment = request.comment,
                onlyVisibleForKleiderwart = request.onlyVisibleForKleiderwart,
                shouldBeShownOnDashboard = request.shouldBeShownOnDashboard,
            )
        )
    }

    fun deleteLocation(id: Long) {
        findOrThrow(id)
        repository.deleteById(id)
    }

    private fun findOrThrow(id: Long): ClothingLocation {
        return repository.findById(id)
            ?: throw NotFoundException("Clothing location not found for id: $id")
    }
}
