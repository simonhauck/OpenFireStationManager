package io.github.simonhauck.openfirestationmanager.clothing.checkout

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

class CheckoutControllerIT : IntegrationTest() {

    @Autowired private lateinit var checkoutCalls: CheckoutControllerCalls
    @Autowired private lateinit var itemCalls: ClothingItemControllerCalls
    @Autowired private lateinit var typeCalls: ProtectiveClothingTypeControllerCalls
    @Autowired private lateinit var locationCalls: ClothingLocationControllerCalls
    @Autowired private lateinit var adminUserCalls: AdminUserControllerCalls
    @Autowired private lateinit var authCalls: AuthControllerCalls
    @Autowired private lateinit var itemRepository: ClothingItemRepository
    @Autowired private lateinit var movementRepository: ClothingMovementRepository

    // ─── Happy path ───────────────────────────────────────────────────────────

    @Test
    fun `take item at POOL writes movement and returns batchId`() {
        val type = createType()
        val pool = createLocation(LocationType.POOL)
        val personal = createLocation(LocationType.PERSONAL)
        val item = createItem(type, pool)

        val response =
            checkoutCalls.checkout(
                CheckoutRequest(targetLocationId = personal.id, takeItemIds = listOf(item.id)),
                authCookie = validCookieHeader,
            )

        assertThat(response.statusCode).isEqualTo(HttpStatus.OK)
        val body = response.body!!
        assertThat(body.batchId).isNotBlank()

        val updatedItem = itemRepository.findById(item.id)!!
        assertThat(updatedItem.locationId?.id).isEqualTo(personal.id)

        val movements = movementRepository.findAllByItemId(AggregateReference.to(item.id))
        val checkout = movements.first { it.reason == MovementReason.CHECKOUT }
        assertThat(checkout.fromLocationId?.id).isEqualTo(pool.id)
        assertThat(checkout.toLocationId?.id).isEqualTo(personal.id)
        assertThat(checkout.batchId).isEqualTo(body.batchId)
    }

    @Test
    fun `return item at PERSONAL writes movement and returns batchId`() {
        val type = createType()
        val personal = createLocation(LocationType.PERSONAL)
        val waesche = createLocation(LocationType.WAESCHE)
        val item = createItem(type, personal)

        val response =
            checkoutCalls.checkout(
                CheckoutRequest(
                    targetLocationId = personal.id,
                    returnLocationId = waesche.id,
                    returnItemIds = listOf(item.id),
                ),
                authCookie = validCookieHeader,
            )

        assertThat(response.statusCode).isEqualTo(HttpStatus.OK)
        val body = response.body!!
        assertThat(body.batchId).isNotBlank()

        val updatedItem = itemRepository.findById(item.id)!!
        assertThat(updatedItem.locationId?.id).isEqualTo(waesche.id)

        val movements = movementRepository.findAllByItemId(AggregateReference.to(item.id))
        val returnMovement = movements.first { it.reason == MovementReason.RETURN }
        assertThat(returnMovement.fromLocationId?.id).isEqualTo(personal.id)
        assertThat(returnMovement.toLocationId?.id).isEqualTo(waesche.id)
        assertThat(returnMovement.batchId).isEqualTo(body.batchId)
    }

    @Test
    fun `mixed takes and returns share a single batchId`() {
        val type = createType()
        val pool = createLocation(LocationType.POOL)
        val personal = createLocation(LocationType.PERSONAL)
        val waesche = createLocation(LocationType.WAESCHE)
        val takeItem = createItem(type, pool)
        val returnItem = createItem(type, personal)

        val response =
            checkoutCalls.checkout(
                CheckoutRequest(
                    targetLocationId = personal.id,
                    returnLocationId = waesche.id,
                    takeItemIds = listOf(takeItem.id),
                    returnItemIds = listOf(returnItem.id),
                ),
                authCookie = validCookieHeader,
            )

        assertThat(response.statusCode).isEqualTo(HttpStatus.OK)
        val body = response.body!!

        val takeMovements = movementRepository.findAllByItemId(AggregateReference.to(takeItem.id))
        val returnMovements =
            movementRepository.findAllByItemId(AggregateReference.to(returnItem.id))

        val checkoutMovement = takeMovements.first { it.reason == MovementReason.CHECKOUT }
        val returnMovement = returnMovements.first { it.reason == MovementReason.RETURN }

        assertThat(checkoutMovement.batchId).isEqualTo(body.batchId)
        assertThat(returnMovement.batchId).isEqualTo(body.batchId)
    }

    // ─── Conflict (409) ───────────────────────────────────────────────────────

    @Test
    fun `returns 409 when return item is not at the target PERSONAL location`() {
        val type = createType()
        val pool = createLocation(LocationType.POOL)
        val personal = createLocation(LocationType.PERSONAL)
        val waesche = createLocation(LocationType.WAESCHE)
        val item = createItem(type, pool) // Not at PERSONAL

        val response =
            checkoutCalls.checkoutExpectingError(
                CheckoutRequest(
                    targetLocationId = personal.id,
                    returnLocationId = waesche.id,
                    returnItemIds = listOf(item.id),
                ),
                authCookie = validCookieHeader,
            )

        assertThat(response.statusCode).isEqualTo(HttpStatus.CONFLICT)
    }

    // ─── Hard 400 validation ──────────────────────────────────────────────────

    @Test
    fun `returns 400 when both takeItemIds and returnItemIds are empty`() {
        val personal = createLocation(LocationType.PERSONAL)

        val response =
            checkoutCalls.checkoutExpectingError(
                CheckoutRequest(targetLocationId = personal.id),
                authCookie = validCookieHeader,
            )

        assertThat(response.statusCode).isEqualTo(HttpStatus.BAD_REQUEST)
    }

    @Test
    fun `returns 400 when same item appears in both takeItemIds and returnItemIds`() {
        val type = createType()
        val pool = createLocation(LocationType.POOL)
        val personal = createLocation(LocationType.PERSONAL)
        val waesche = createLocation(LocationType.WAESCHE)
        val item = createItem(type, pool)

        val response =
            checkoutCalls.checkoutExpectingError(
                CheckoutRequest(
                    targetLocationId = personal.id,
                    returnLocationId = waesche.id,
                    takeItemIds = listOf(item.id),
                    returnItemIds = listOf(item.id),
                ),
                authCookie = validCookieHeader,
            )

        assertThat(response.statusCode).isEqualTo(HttpStatus.BAD_REQUEST)
    }

    @Test
    fun `returns 400 when targetLocationId is not PERSONAL type`() {
        val pool = createLocation(LocationType.POOL)
        val type = createType()
        val poolItem = createItem(type, pool)

        val response =
            checkoutCalls.checkoutExpectingError(
                CheckoutRequest(targetLocationId = pool.id, takeItemIds = listOf(poolItem.id)),
                authCookie = validCookieHeader,
            )

        assertThat(response.statusCode).isEqualTo(HttpStatus.BAD_REQUEST)
    }

    @Test
    fun `returns 400 when returnLocationId is not WAESCHE type`() {
        val type = createType()
        val pool = createLocation(LocationType.POOL)
        val personal = createLocation(LocationType.PERSONAL)
        val item = createItem(type, pool)

        val response =
            checkoutCalls.checkoutExpectingError(
                CheckoutRequest(
                    targetLocationId = personal.id,
                    returnLocationId = personal.id, // PERSONAL instead of WAESCHE
                    takeItemIds = listOf(item.id),
                ),
                authCookie = validCookieHeader,
            )

        assertThat(response.statusCode).isEqualTo(HttpStatus.BAD_REQUEST)
    }

    @Test
    fun `returns 400 when non-Kleiderwart references a restricted location`() {
        val type = createType()
        val pool = createLocation(LocationType.POOL)
        val restrictedPersonal =
            createLocation(LocationType.PERSONAL, onlyVisibleForKleiderwart = true)
        val item = createItem(type, pool)

        val userCookie = createRegularUserCookie()

        val response =
            checkoutCalls.checkoutExpectingError(
                CheckoutRequest(
                    targetLocationId = restrictedPersonal.id,
                    takeItemIds = listOf(item.id),
                ),
                authCookie = userCookie,
            )

        assertThat(response.statusCode).isEqualTo(HttpStatus.BAD_REQUEST)
    }

    // ─── Cache invariant ──────────────────────────────────────────────────────

    @Test
    fun `item locationId is updated after checkout`() {
        val type = createType()
        val pool = createLocation(LocationType.POOL)
        val personal = createLocation(LocationType.PERSONAL)
        val item = createItem(type, pool)

        checkoutCalls.checkout(
            CheckoutRequest(targetLocationId = personal.id, takeItemIds = listOf(item.id)),
            authCookie = validCookieHeader,
        )

        val updatedItem = itemRepository.findById(item.id)!!
        assertThat(updatedItem.locationId?.id).isEqualTo(personal.id)

        val movements = movementRepository.findAllByItemId(AggregateReference.to(item.id))
        val lastMovement = movements.maxByOrNull { it.id }!!
        assertThat(lastMovement.toLocationId?.id).isEqualTo(updatedItem.locationId?.id)
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private fun createType(name: String = "Type-${System.nanoTime()}"): ClothingType =
        typeCalls
            .createType(CreateOrUpdateClothingTypeRequest(name), authCookie = validCookieHeader)
            .body!!

    private fun createLocation(
        type: LocationType,
        name: String = "Loc-${System.nanoTime()}",
        onlyVisibleForKleiderwart: Boolean = false,
    ): ClothingLocation =
        locationCalls
            .createLocation(
                CreateClothingLocationRequest(
                    name = name,
                    comment = "",
                    onlyVisibleForKleiderwart = onlyVisibleForKleiderwart,
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
