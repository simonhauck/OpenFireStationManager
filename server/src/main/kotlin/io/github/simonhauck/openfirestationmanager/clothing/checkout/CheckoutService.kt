package io.github.simonhauck.openfirestationmanager.clothing.checkout

import io.github.simonhauck.openfirestationmanager.clothing.item.ClothingItem
import io.github.simonhauck.openfirestationmanager.clothing.item.ClothingItemRepository
import io.github.simonhauck.openfirestationmanager.clothing.item.ClothingItemService
import io.github.simonhauck.openfirestationmanager.clothing.location.ClothingLocation
import io.github.simonhauck.openfirestationmanager.clothing.location.ClothingLocationService
import io.github.simonhauck.openfirestationmanager.clothing.location.LocationType
import io.github.simonhauck.openfirestationmanager.clothing.movement.MovementReason
import io.github.simonhauck.openfirestationmanager.clothing.movement.MovementService
import io.github.simonhauck.openfirestationmanager.common.PublicApiException
import io.github.simonhauck.openfirestationmanager.security.auth.CurrentUserProvider
import io.github.simonhauck.openfirestationmanager.usermanagement.UserRole
import java.util.UUID
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class CheckoutService(
    private val itemRepository: ClothingItemRepository,
    private val movementService: MovementService,
    private val locationService: ClothingLocationService,
    private val clothingItemService: ClothingItemService,
    private val currentUserProvider: CurrentUserProvider,
) {

    @Transactional
    fun checkout(request: CheckoutRequest): CheckoutResponse {

        val batchId = UUID.randomUUID().toString()

        if (request.targetLocationId != null) {
            val takeItems = request.takeItemIds.map { clothingItemService.getItemById(it) }

            val location =
                locationService
                    .getLocationById(request.targetLocationId)
                    .validate(listOf(LocationType.PERSONAL))

            takeItems.moveItemsToLocation(location, batchId, MovementReason.CHECKOUT)
        }

        if (request.returnLocationId != null) {
            val returnItems = request.returnItemIds.map { clothingItemService.getItemById(it) }
            val location =
                locationService
                    .getLocationById(request.returnLocationId)
                    .validate(listOf(LocationType.WAESCHE, LocationType.POOL))

            returnItems.moveItemsToLocation(location, batchId, MovementReason.RETURN)
        }

        return CheckoutResponse(batchId)
    }

    private fun List<ClothingItem>.moveItemsToLocation(
        location: ClothingLocation,
        batchId: String,
        reason: MovementReason,
    ) {
        this.forEach {
            movementService.recordMovement(
                item = it,
                fromLocationId = it.locationId?.id,
                toLocationId = location.id,
                reason = reason,
                batchId = batchId, // batchId will be set later after validation
            )
            itemRepository.save(it.copy(locationId = location.getIdAsReference()))
        }
    }

    private fun ClothingLocation.validate(
        allowedLocationTypes: List<LocationType>
    ): ClothingLocation {
        val hasMatchingType = allowedLocationTypes.any { it == this.type }

        if (
            this.onlyVisibleForKleiderwart &&
                !currentUserProvider.checkCurrentUserHasRole(UserRole.KLEIDERWART)
        ) {
            throw PublicApiException(
                HttpStatus.BAD_REQUEST,
                "Location benötigt rolle ${UserRole.KLEIDERWART}",
            )
        }

        if (!hasMatchingType) {
            throw PublicApiException(
                HttpStatus.BAD_REQUEST,
                "Location typ ${this.type} für location ${this.name} ist für diese Aktion nicht gültig. Der Typ muss einer der folgenden sein: ${allowedLocationTypes.joinToString(", ")}",
            )
        }

        return this
    }
}
