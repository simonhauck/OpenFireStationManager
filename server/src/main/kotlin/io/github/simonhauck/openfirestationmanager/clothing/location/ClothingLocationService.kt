package io.github.simonhauck.openfirestationmanager.clothing.location

import io.github.simonhauck.openfirestationmanager.common.NotFoundException
import io.github.simonhauck.openfirestationmanager.common.PublicApiException
import org.springframework.data.jdbc.core.mapping.AggregateReference
import org.springframework.http.HttpStatus
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
        validateMemberAssignment(request.type, request.memberId)
        val entity =
            ClothingLocation(
                name = request.name,
                comment = request.comment,
                onlyVisibleForKleiderwart = request.onlyVisibleForKleiderwart,
                type = request.type,
                memberId = request.memberId,
            )
        return repository.save(entity)
    }

    fun createBatchLocations(
        requests: List<CreateClothingLocationRequest>
    ): List<ClothingLocation> {
        requests.forEach { validateMemberAssignment(it.type, it.memberId) }
        val entities = requests.map { req ->
            ClothingLocation(
                name = req.name,
                comment = req.comment,
                onlyVisibleForKleiderwart = req.onlyVisibleForKleiderwart,
                type = req.type,
                memberId = req.memberId,
            )
        }
        return repository.saveAll(entities)
    }

    fun updateLocation(id: Long, request: CreateClothingLocationRequest): ClothingLocation {
        val existing = getLocationById(id)
        validateMemberAssignment(request.type, request.memberId)
        if (existing.memberId != null && request.type != LocationType.PERSONAL) {
            throw PublicApiException(
                HttpStatus.BAD_REQUEST,
                "A location with an assigned member must be unassigned before changing its type.",
            )
        }
        return repository.save(
            existing.copy(
                name = request.name,
                comment = request.comment,
                onlyVisibleForKleiderwart = request.onlyVisibleForKleiderwart,
                type = request.type,
                memberId = request.memberId,
            )
        )
    }

    fun deleteLocation(id: Long) {
        getLocationById(id)
        repository.deleteById(id)
    }

    private fun validateMemberAssignment(
        type: LocationType,
        memberId: AggregateReference<*, Long>?,
    ) {
        if (memberId != null && type != LocationType.PERSONAL) {
            throw PublicApiException(
                HttpStatus.BAD_REQUEST,
                "Only PERSONAL locations may be assigned to a member.",
            )
        }
    }
}
