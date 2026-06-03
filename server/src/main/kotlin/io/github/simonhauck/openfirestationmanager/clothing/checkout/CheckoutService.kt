package io.github.simonhauck.openfirestationmanager.clothing.checkout

import io.github.simonhauck.openfirestationmanager.clothing.item.ClothingItem
import io.github.simonhauck.openfirestationmanager.clothing.item.ClothingItemRepository
import io.github.simonhauck.openfirestationmanager.clothing.location.ClothingLocation
import io.github.simonhauck.openfirestationmanager.clothing.location.ClothingLocationRepository
import io.github.simonhauck.openfirestationmanager.clothing.location.LocationType
import io.github.simonhauck.openfirestationmanager.clothing.movement.MovementReason
import io.github.simonhauck.openfirestationmanager.clothing.movement.MovementService
import io.github.simonhauck.openfirestationmanager.common.PublicApiException
import java.util.UUID
import org.springframework.data.jdbc.core.mapping.AggregateReference
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class CheckoutService(
    private val itemRepository: ClothingItemRepository,
    private val locationRepository: ClothingLocationRepository,
    private val movementService: MovementService,
) {

    @Transactional
    fun checkout(request: CheckoutRequest, isKleiderwart: Boolean): CheckoutResponse {
        validateRequest(request, isKleiderwart)

        val takeItems = request.takeItemIds.map { getItemOrBadRequest(it) }
        val returnItems = request.returnItemIds.map { getItemOrBadRequest(it) }

        val batchId = UUID.randomUUID().toString()

        if (takeItems.isNotEmpty()) {
            val targetId = request.targetLocationId!!
            for (item in takeItems) {
                val fromLocationId = item.locationId?.id
                movementService.recordMovement(
                    item = item,
                    fromLocationId = fromLocationId,
                    toLocationId = targetId,
                    reason = MovementReason.CHECKOUT,
                    batchId = batchId,
                )
                itemRepository.save(item.copy(locationId = AggregateReference.to(targetId)))
            }
        }

        val returnToLocationId = request.returnLocationId
        for (item in returnItems) {
            val fromLocationId = item.locationId?.id
            movementService.recordMovement(
                item = item,
                fromLocationId = fromLocationId,
                toLocationId = returnToLocationId,
                reason = MovementReason.RETURN,
                batchId = batchId,
            )
            val newLocationRef =
                returnToLocationId?.let { AggregateReference.to<ClothingLocation, Long>(it) }
            itemRepository.save(item.copy(locationId = newLocationRef))
        }

        return CheckoutResponse(batchId)
    }

    private fun validateRequest(request: CheckoutRequest, isKleiderwart: Boolean) {
        if (request.takeItemIds.isEmpty() && request.returnItemIds.isEmpty()) {
            throw PublicApiException(
                HttpStatus.BAD_REQUEST,
                "takeItemIds and returnItemIds cannot both be empty",
            )
        }

        val overlap = request.takeItemIds.toSet().intersect(request.returnItemIds.toSet())
        if (overlap.isNotEmpty()) {
            throw PublicApiException(
                HttpStatus.BAD_REQUEST,
                "Same item cannot appear in both takeItemIds and returnItemIds",
            )
        }

        if (request.targetLocationId != null) {
            val targetLocation =
                locationRepository.findById(request.targetLocationId)
                    ?: throw PublicApiException(
                        HttpStatus.BAD_REQUEST,
                        "targetLocationId not found",
                    )
            if (targetLocation.type != LocationType.PERSONAL) {
                throw PublicApiException(
                    HttpStatus.BAD_REQUEST,
                    "targetLocationId must be a PERSONAL location",
                )
            }
            checkLocationVisibility(targetLocation, isKleiderwart)
        } else if (request.takeItemIds.isNotEmpty()) {
            throw PublicApiException(
                HttpStatus.BAD_REQUEST,
                "targetLocationId must not be null when takeItemIds are present",
            )
        }

        if (request.returnLocationId != null) {
            val returnLocation =
                locationRepository.findById(request.returnLocationId)
                    ?: throw PublicApiException(
                        HttpStatus.BAD_REQUEST,
                        "returnLocationId not found",
                    )
            if (
                returnLocation.type != LocationType.WAESCHE &&
                    returnLocation.type != LocationType.POOL
            ) {
                throw PublicApiException(
                    HttpStatus.BAD_REQUEST,
                    "returnLocationId must be a WAESCHE or POOL location",
                )
            }
            checkLocationVisibility(returnLocation, isKleiderwart)
        }
    }

    private fun checkLocationVisibility(location: ClothingLocation, isKleiderwart: Boolean) {
        if (location.onlyVisibleForKleiderwart && !isKleiderwart) {
            throw PublicApiException(
                HttpStatus.BAD_REQUEST,
                "Location is restricted to Kleiderwart",
            )
        }
    }

    private fun getItemOrBadRequest(id: Long): ClothingItem {
        return itemRepository.findById(id)
            ?: throw PublicApiException(HttpStatus.BAD_REQUEST, "Item with id $id not found")
    }
}
