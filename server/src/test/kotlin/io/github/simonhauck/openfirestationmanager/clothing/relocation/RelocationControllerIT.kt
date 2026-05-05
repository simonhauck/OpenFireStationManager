package io.github.simonhauck.openfirestationmanager.clothing.relocation

import io.github.simonhauck.openfirestationmanager.IntegrationTest
import io.github.simonhauck.openfirestationmanager.clothing.item.ClothingItem
import io.github.simonhauck.openfirestationmanager.clothing.item.ClothingItemControllerCalls
import io.github.simonhauck.openfirestationmanager.clothing.item.ClothingItemRepository
import io.github.simonhauck.openfirestationmanager.clothing.item.CreateOrUpdateClothingItemRequest
import io.github.simonhauck.openfirestationmanager.clothing.location.ClothingLocation
import io.github.simonhauck.openfirestationmanager.clothing.location.ClothingLocationControllerCalls
import io.github.simonhauck.openfirestationmanager.clothing.location.CreateClothingLocationRequest
import io.github.simonhauck.openfirestationmanager.clothing.location.LocationType
import io.github.simonhauck.openfirestationmanager.clothing.movement.ClothingMovementRepository
import io.github.simonhauck.openfirestationmanager.clothing.movement.MovementReason
import io.github.simonhauck.openfirestationmanager.clothing.type.ClothingType
import io.github.simonhauck.openfirestationmanager.clothing.type.CreateOrUpdateClothingTypeRequest
import io.github.simonhauck.openfirestationmanager.clothing.type.ProtectiveClothingTypeControllerCalls
import io.github.simonhauck.openfirestationmanager.security.auth.AuthControllerCalls
import io.github.simonhauck.openfirestationmanager.usermanagement.AdminUserControllerCalls
import io.github.simonhauck.openfirestationmanager.usermanagement.CreateUserRequest
import io.github.simonhauck.openfirestationmanager.usermanagement.UserRole
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.data.jdbc.core.mapping.AggregateReference
import org.springframework.http.HttpStatus

class RelocationControllerIT : IntegrationTest() {

    @Autowired private lateinit var relocationCalls: RelocationControllerCalls
    @Autowired private lateinit var itemCalls: ClothingItemControllerCalls
    @Autowired private lateinit var typeCalls: ProtectiveClothingTypeControllerCalls
    @Autowired private lateinit var locationCalls: ClothingLocationControllerCalls
    @Autowired private lateinit var adminUserCalls: AdminUserControllerCalls
    @Autowired private lateinit var authCalls: AuthControllerCalls
    @Autowired private lateinit var itemRepository: ClothingItemRepository
    @Autowired private lateinit var movementRepository: ClothingMovementRepository

    // ─── Happy path ───────────────────────────────────────────────────────────

    @Test
    fun `relocate moves items to target location and writes RELOCATION movements`() {
        val type = createType()
        val source = createLocation(LocationType.POOL)
        val target = createLocation(LocationType.POOL)
        val item1 = createItem(type, source)
        val item2 = createItem(type, source)

        val response =
            relocationCalls.relocate(
                RelocationRequest(
                    targetLocationId = target.id,
                    itemIds = listOf(item1.id, item2.id),
                ),
                authCookie = validCookieHeader,
            )

        assertThat(response.statusCode).isEqualTo(HttpStatus.OK)
        val body = response.body!!
        assertThat(body.batchId).isNotBlank()

        // Both items should now be at the target location
        val updatedItem1 = itemRepository.findById(item1.id)!!
        val updatedItem2 = itemRepository.findById(item2.id)!!
        assertThat(updatedItem1.locationId?.id).isEqualTo(target.id)
        assertThat(updatedItem2.locationId?.id).isEqualTo(target.id)

        // Movements should be recorded with RELOCATION reason and a shared batchId
        val movements1 = movementRepository.findAllByItemId(AggregateReference.to(item1.id))
        val movements2 = movementRepository.findAllByItemId(AggregateReference.to(item2.id))

        val relocation1 = movements1.first { it.reason == MovementReason.RELOCATION }
        val relocation2 = movements2.first { it.reason == MovementReason.RELOCATION }

        assertThat(relocation1.fromLocationId?.id).isEqualTo(source.id)
        assertThat(relocation1.toLocationId?.id).isEqualTo(target.id)
        assertThat(relocation2.fromLocationId?.id).isEqualTo(source.id)
        assertThat(relocation2.toLocationId?.id).isEqualTo(target.id)

        // Both movements share the same batchId
        assertThat(relocation1.batchId).isEqualTo(body.batchId)
        assertThat(relocation2.batchId).isEqualTo(body.batchId)
        assertThat(relocation1.batchId).isEqualTo(relocation2.batchId)
    }

    @Test
    fun `relocate infers source location from item current location`() {
        val type = createType()
        val personalLocation = createLocation(LocationType.PERSONAL)
        val poolTarget = createLocation(LocationType.POOL)
        val item = createItem(type, personalLocation)

        val response =
            relocationCalls.relocate(
                RelocationRequest(
                    targetLocationId = poolTarget.id,
                    itemIds = listOf(item.id),
                ),
                authCookie = validCookieHeader,
            )

        assertThat(response.statusCode).isEqualTo(HttpStatus.OK)

        val movements = movementRepository.findAllByItemId(AggregateReference.to(item.id))
        val relocationMovement = movements.first { it.reason == MovementReason.RELOCATION }
        assertThat(relocationMovement.fromLocationId?.id).isEqualTo(personalLocation.id)
        assertThat(relocationMovement.toLocationId?.id).isEqualTo(poolTarget.id)
    }

    // ─── Validation errors ────────────────────────────────────────────────────

    @Test
    fun `returns 400 when itemIds is empty`() {
        val target = createLocation(LocationType.POOL)

        val response =
            relocationCalls.relocateExpectingError(
                RelocationRequest(targetLocationId = target.id, itemIds = emptyList()),
                authCookie = validCookieHeader,
            )

        assertThat(response.statusCode).isEqualTo(HttpStatus.BAD_REQUEST)
    }

    @Test
    fun `returns 400 when targetLocationId does not exist`() {
        val type = createType()
        val source = createLocation(LocationType.POOL)
        val item = createItem(type, source)

        val response =
            relocationCalls.relocateExpectingError(
                RelocationRequest(targetLocationId = 999_999_999L, itemIds = listOf(item.id)),
                authCookie = validCookieHeader,
            )

        assertThat(response.statusCode).isEqualTo(HttpStatus.BAD_REQUEST)
    }

    @Test
    fun `returns 400 when an item id does not exist`() {
        val target = createLocation(LocationType.POOL)

        val response =
            relocationCalls.relocateExpectingError(
                RelocationRequest(targetLocationId = target.id, itemIds = listOf(999_999_999L)),
                authCookie = validCookieHeader,
            )

        assertThat(response.statusCode).isEqualTo(HttpStatus.BAD_REQUEST)
    }

    // ─── Role security ────────────────────────────────────────────────────────

    @Test
    fun `returns 403 for non-Kleiderwart callers`() {
        val type = createType()
        val source = createLocation(LocationType.POOL)
        val target = createLocation(LocationType.POOL)
        val item = createItem(type, source)

        val userCookie = createRegularUserCookie()

        val response =
            relocationCalls.relocateExpectingError(
                RelocationRequest(targetLocationId = target.id, itemIds = listOf(item.id)),
                authCookie = userCookie,
            )

        assertThat(response.statusCode).isEqualTo(HttpStatus.FORBIDDEN)
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private fun createType(name: String = "Type-${System.nanoTime()}"): ClothingType =
        typeCalls
            .createType(CreateOrUpdateClothingTypeRequest(name), authCookie = validCookieHeader)
            .body!!

    private fun createLocation(
        type: LocationType,
        name: String = "Loc-${System.nanoTime()}",
    ): ClothingLocation =
        locationCalls
            .createLocation(
                CreateClothingLocationRequest(
                    name = name,
                    comment = "",
                    onlyVisibleForKleiderwart = false,
                    type = type,
                ),
                authCookie = validCookieHeader,
            )
            .body!!

    private fun createItem(type: ClothingType, location: ClothingLocation): ClothingItem =
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

    private fun createRegularUserCookie(): String {
        val username = "user-${System.nanoTime()}"
        adminUserCalls.createUser(
            CreateUserRequest(
                username = username,
                password = "password",
                firstName = "Test",
                lastName = "User",
                roles = listOf(UserRole.USER),
            ),
            authCookie = validCookieHeader,
        )
        val loginResponse = authCalls.login(username = username, password = "password")
        return authCalls.extractAuthCookie(loginResponse)!!
    }
}
