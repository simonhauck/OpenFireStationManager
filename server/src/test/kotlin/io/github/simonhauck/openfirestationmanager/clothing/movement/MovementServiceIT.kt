package io.github.simonhauck.openfirestationmanager.clothing.movement

import io.github.simonhauck.openfirestationmanager.IntegrationTest
import io.github.simonhauck.openfirestationmanager.clothing.item.ClothingItemControllerCalls
import io.github.simonhauck.openfirestationmanager.clothing.item.CreateOrUpdateClothingItemRequest
import io.github.simonhauck.openfirestationmanager.clothing.location.ClothingLocation
import io.github.simonhauck.openfirestationmanager.clothing.location.ClothingLocationControllerCalls
import io.github.simonhauck.openfirestationmanager.clothing.location.CreateClothingLocationRequest
import io.github.simonhauck.openfirestationmanager.clothing.location.LocationType
import io.github.simonhauck.openfirestationmanager.clothing.type.ClothingType
import io.github.simonhauck.openfirestationmanager.clothing.type.CreateOrUpdateClothingTypeRequest
import io.github.simonhauck.openfirestationmanager.clothing.type.ProtectiveClothingTypeControllerCalls
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.data.jdbc.core.mapping.AggregateReference

class MovementServiceIT : IntegrationTest() {

    @Autowired private lateinit var itemCalls: ClothingItemControllerCalls
    @Autowired private lateinit var typeCalls: ProtectiveClothingTypeControllerCalls
    @Autowired private lateinit var locationCalls: ClothingLocationControllerCalls
    @Autowired private lateinit var movementService: MovementService

    @Test
    fun `creating an item with a location writes an INITIAL_PLACEMENT movement`() {
        val type = createType()
        val location = createLocation()
        val item =
            itemCalls
                .createItem(
                    CreateOrUpdateClothingItemRequest(
                        typeId = type.id,
                        size = "M",
                        locationId = AggregateReference.to(location.id),
                    ),
                    authCookie = validCookieHeader,
                )
                .body!!

        val movements = movementService.getMovementsForItem(item.id)

        assertThat(movements).hasSize(1)
        val movement = movements.first()
        assertThat(movement.reason).isEqualTo(MovementReason.INITIAL_PLACEMENT)
        assertThat(movement.fromLocationId).isNull()
        assertThat(movement.toLocationId?.id).isEqualTo(item.locationId?.id)
    }

    @Test
    fun `creating an item without a location writes no movement`() {
        val type = createType()
        val item =
            itemCalls
                .createItem(
                    CreateOrUpdateClothingItemRequest(typeId = type.id, size = "L"),
                    authCookie = validCookieHeader,
                )
                .body!!

        val movements = movementService.getMovementsForItem(item.id)

        assertThat(movements).isEmpty()
    }

    @Test
    fun `updating an item location writes a MANUAL_CORRECTION movement`() {
        val type = createType()
        val locationA = createLocation()
        val locationB = createLocation()
        val item =
            itemCalls
                .createItem(
                    CreateOrUpdateClothingItemRequest(
                        typeId = type.id,
                        size = "S",
                        locationId = AggregateReference.to(locationA.id),
                    ),
                    authCookie = validCookieHeader,
                )
                .body!!

        val updated =
            itemCalls
                .updateItem(
                    item.id,
                    CreateOrUpdateClothingItemRequest(
                        typeId = type.id,
                        size = "S",
                        locationId = AggregateReference.to(locationB.id),
                    ),
                    authCookie = validCookieHeader,
                )
                .body!!

        val movements = movementService.getMovementsForItem(item.id)
        val latest = movements.maxByOrNull { it.id }!!

        assertThat(latest.reason).isEqualTo(MovementReason.MANUAL_CORRECTION)
        assertThat(latest.fromLocationId?.id).isEqualTo(locationA.id)
        assertThat(latest.toLocationId?.id).isEqualTo(updated.locationId?.id)
    }

    @Test
    fun `assigning location for first time via update writes an INITIAL_PLACEMENT movement`() {
        val type = createType()
        val location = createLocation()
        val item =
            itemCalls
                .createItem(
                    CreateOrUpdateClothingItemRequest(typeId = type.id, size = "XL"),
                    authCookie = validCookieHeader,
                )
                .body!!

        val updated =
            itemCalls
                .updateItem(
                    item.id,
                    CreateOrUpdateClothingItemRequest(
                        typeId = type.id,
                        size = "XL",
                        locationId = AggregateReference.to(location.id),
                    ),
                    authCookie = validCookieHeader,
                )
                .body!!

        val movements = movementService.getMovementsForItem(item.id)

        assertThat(movements).hasSize(1)
        assertThat(movements.first().reason).isEqualTo(MovementReason.INITIAL_PLACEMENT)
        assertThat(movements.first().toLocationId?.id).isEqualTo(updated.locationId?.id)
    }

    @Test
    fun `batch creating items with locations writes INITIAL_PLACEMENT movements`() {
        val type = createType()
        val location = createLocation()

        val items =
            itemCalls
                .createBatchItems(
                    io.github.simonhauck.openfirestationmanager.clothing.item
                        .BatchCreateClothingItemsRequest(
                            items =
                                listOf(
                                    CreateOrUpdateClothingItemRequest(
                                        typeId = type.id,
                                        size = "S",
                                        locationId = AggregateReference.to(location.id),
                                    ),
                                    CreateOrUpdateClothingItemRequest(
                                        typeId = type.id,
                                        size = "M",
                                        locationId = AggregateReference.to(location.id),
                                    ),
                                )
                        ),
                    authCookie = validCookieHeader,
                )
                .body!!

        items.forEach { item ->
            val movements = movementService.getMovementsForItem(item.id)
            assertThat(movements).hasSize(1)
            assertThat(movements.first().reason).isEqualTo(MovementReason.INITIAL_PLACEMENT)
            assertThat(movements.first().toLocationId?.id).isEqualTo(item.locationId?.id)
        }
    }

    private fun createLocation(name: String = "Location-${System.nanoTime()}"): ClothingLocation {
        return locationCalls
            .createLocation(
                CreateClothingLocationRequest(
                    name = name,
                    comment = "",
                    onlyVisibleForKleiderwart = false,
                    type = LocationType.POOL,
                ),
                authCookie = validCookieHeader,
            )
            .body!!
    }

    private fun createType(name: String = "Type-${System.nanoTime()}"): ClothingType {
        return typeCalls
            .createType(
                CreateOrUpdateClothingTypeRequest(name = name),
                authCookie = validCookieHeader,
            )
            .body!!
    }
}
