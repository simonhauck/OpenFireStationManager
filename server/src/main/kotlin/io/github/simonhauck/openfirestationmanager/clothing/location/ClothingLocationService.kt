package io.github.simonhauck.openfirestationmanager.clothing.location

import io.github.simonhauck.openfirestationmanager.common.NotFoundException
import org.springframework.stereotype.Service

@Service
class ClothingLocationService(private val repository: ClothingLocationRepository) {

    fun getAllLocations(): List<ClothingLocation> = repository.findAll().sortedBy { it.id }

    fun getLocationById(id: Long): ClothingLocation {
        return repository.findById(id)
            ?: throw NotFoundException("Clothing location not found for id: $id")
    }

    fun getDashboardLocations(): List<ClothingLocation> =
        repository.findAllByTypeIn(listOf(LocationType.POOL, LocationType.WAESCHE)).sortedBy {
            it.id
        }

    fun createLocation(request: CreateClothingLocationRequest): ClothingLocation {
        val entity =
            ClothingLocation(
                name = request.name,
                comment = request.comment,
                onlyVisibleForKleiderwart = request.onlyVisibleForKleiderwart,
                type = request.type,
            )
        return repository.save(entity)
    }

    fun createBatchLocations(
        requests: List<CreateClothingLocationRequest>
    ): List<ClothingLocation> {
        val entities =
            requests.map { req ->
                ClothingLocation(
                    name = req.name,
                    comment = req.comment,
                    onlyVisibleForKleiderwart = req.onlyVisibleForKleiderwart,
                    type = req.type,
                )
            }
        return repository.saveAll(entities)
    }

    fun updateLocation(id: Long, request: CreateClothingLocationRequest): ClothingLocation {
        val existing = getLocationById(id)
        return repository.save(
            existing.copy(
                name = request.name,
                comment = request.comment,
                onlyVisibleForKleiderwart = request.onlyVisibleForKleiderwart,
                type = request.type,
            )
        )
    }

    fun deleteLocation(id: Long) {
        getLocationById(id)
        repository.deleteById(id)
    }
}
