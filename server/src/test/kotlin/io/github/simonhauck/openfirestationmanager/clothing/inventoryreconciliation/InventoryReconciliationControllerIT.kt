package io.github.simonhauck.openfirestationmanager.clothing.inventoryreconciliation

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

class InventoryReconciliationControllerIT : IntegrationTest() {

    @Autowired private lateinit var reconciliationCalls: InventoryReconciliationControllerCalls
    @Autowired private lateinit var itemCalls: ClothingItemControllerCalls
    @Autowired private lateinit var typeCalls: ProtectiveClothingTypeControllerCalls
    @Autowired private lateinit var locationCalls: ClothingLocationControllerCalls
    @Autowired private lateinit var adminUserCalls: AdminUserControllerCalls
    @Autowired private lateinit var authCalls: AuthControllerCalls
    @Autowired private lateinit var itemRepository: ClothingItemRepository
    @Autowired private lateinit var movementRepository: ClothingMovementRepository

    @Test
    fun `preview correctly identifies unchanged, found, and missing items`() {
        val type = createType()
        val location = createLocation(LocationType.POOL)
        val otherLocation = createLocation(LocationType.OTHER)
        val itemAtLocation = createItem(type, location)
        val itemElsewhere = createItem(type, otherLocation)
        val itemNotScanned = createItem(type, location)

        val response =
            reconciliationCalls.preview(
                locationId = location.id,
                request =
                    InventoryReconciliationPreviewRequest(
                        scannedItemIds = listOf(itemAtLocation.id, itemElsewhere.id)
                    ),
                authCookie = validCookieHeader,
            )

        assertThat(response.statusCode).isEqualTo(HttpStatus.OK)
        val body = response.body!!
        assertThat(body.unchangedItems).hasSize(1)
        assertThat(body.unchangedItems[0].clothingItem.id).isEqualTo(itemAtLocation.id)
        assertThat(body.foundItems).hasSize(1)
        assertThat(body.foundItems[0].clothingItem.id).isEqualTo(itemElsewhere.id)
        assertThat(body.missingItems).hasSize(1)
        assertThat(body.missingItems[0].clothingItem.id).isEqualTo(itemNotScanned.id)
    }

    @Test
    fun `preview returns all items as missing when no items are scanned`() {
        val type = createType()
        val location = createLocation(LocationType.POOL)
        val item1 = createItem(type, location)
        val item2 = createItem(type, location)

        val response =
            reconciliationCalls.preview(
                locationId = location.id,
                request = InventoryReconciliationPreviewRequest(scannedItemIds = emptyList()),
                authCookie = validCookieHeader,
            )

        assertThat(response.statusCode).isEqualTo(HttpStatus.OK)
        val body = response.body!!
        assertThat(body.unchangedItems).isEmpty()
        assertThat(body.foundItems).isEmpty()
        assertThat(body.missingItems).hasSize(2)
    }

    @Test
    fun `preview returns 404 when location does not exist`() {
        val response =
            reconciliationCalls.previewExpectingError(
                locationId = 999_999_999L,
                request = InventoryReconciliationPreviewRequest(scannedItemIds = emptyList()),
                authCookie = validCookieHeader,
            )

        assertThat(response.statusCode).isEqualTo(HttpStatus.NOT_FOUND)
    }

    @Test
    fun `preview returns 404 when scanned item does not exist`() {
        val location = createLocation(LocationType.POOL)

        val response =
            reconciliationCalls.previewExpectingError(
                locationId = location.id,
                request =
                    InventoryReconciliationPreviewRequest(scannedItemIds = listOf(999_999_999L)),
                authCookie = validCookieHeader,
            )

        assertThat(response.statusCode).isEqualTo(HttpStatus.NOT_FOUND)
    }

    @Test
    fun `preview returns 403 for non-Kleiderwart callers`() {
        val type = createType()
        val location = createLocation(LocationType.POOL)
        val item = createItem(type, location)
        val userCookie = createRegularUserCookie()

        val response =
            reconciliationCalls.previewExpectingError(
                locationId = location.id,
                request = InventoryReconciliationPreviewRequest(scannedItemIds = listOf(item.id)),
                authCookie = userCookie,
            )

        assertThat(response.statusCode).isEqualTo(HttpStatus.FORBIDDEN)
    }

    @Test
    fun `execute moves found items to location and missing items to null with INVENTORY_RECONCILIATION movements`() {
        val type = createType()
        val location = createLocation(LocationType.POOL)
        val otherLocation = createLocation(LocationType.OTHER)
        val itemAtLocation = createItem(type, location)
        val itemElsewhere = createItem(type, otherLocation)
        val itemNotScanned = createItem(type, location)

        val previewResponse =
            reconciliationCalls.preview(
                locationId = location.id,
                request =
                    InventoryReconciliationPreviewRequest(
                        scannedItemIds = listOf(itemAtLocation.id, itemElsewhere.id)
                    ),
                authCookie = validCookieHeader,
            )

        val previewBody = previewResponse.body!!

        val executeResponse =
            reconciliationCalls.execute(
                locationId = location.id,
                request = previewBody,
                authCookie = validCookieHeader,
            )

        assertThat(executeResponse.statusCode).isEqualTo(HttpStatus.OK)
        val result = executeResponse.body!!
        assertThat(result.foundItemsCount).isEqualTo(1)
        assertThat(result.missingItemsCount).isEqualTo(1)
        assertThat(result.unchangedItemsCount).isEqualTo(1)
        assertThat(result.batchId).isNotBlank()

        val updatedItem1 = itemRepository.findById(itemAtLocation.id)
        val updatedItemElsewhere = itemRepository.findById(itemElsewhere.id)
        val updatedNotScanned = itemRepository.findById(itemNotScanned.id)
        assertThat(updatedItem1?.locationId?.id).isEqualTo(location.id)
        assertThat(updatedItemElsewhere?.locationId?.id).isEqualTo(location.id)
        assertThat(updatedNotScanned?.locationId).isNull()

        val movementsElsewhere =
            movementRepository.findAllByItemId(AggregateReference.to(itemElsewhere.id))
        val foundMovement = movementsElsewhere.first {
            it.reason == MovementReason.INVENTORY_RECONCILIATION
        }
        assertThat(foundMovement.fromLocationId?.id).isEqualTo(otherLocation.id)
        assertThat(foundMovement.toLocationId?.id).isEqualTo(location.id)
        assertThat(foundMovement.batchId).isEqualTo(result.batchId)

        val movementsMissing =
            movementRepository.findAllByItemId(AggregateReference.to(itemNotScanned.id))
        val missingMovement = movementsMissing.first {
            it.reason == MovementReason.INVENTORY_RECONCILIATION
        }
        assertThat(missingMovement.fromLocationId?.id).isEqualTo(location.id)
        assertThat(missingMovement.toLocationId).isNull()
        assertThat(missingMovement.batchId).isEqualTo(result.batchId)
    }

    @Test
    fun `execute returns 403 for non-Kleiderwart callers`() {
        val type = createType()
        val location = createLocation(LocationType.POOL)
        val item = createItem(type, location)
        val userCookie = createRegularUserCookie()

        val previewBody =
            InventoryReconciliationPreviewResponse(
                unchangedItems = emptyList(),
                foundItems = emptyList(),
                missingItems = emptyList(),
            )

        val response =
            reconciliationCalls.executeExpectingError(
                locationId = location.id,
                request = previewBody,
                authCookie = userCookie,
            )

        assertThat(response.statusCode).isEqualTo(HttpStatus.FORBIDDEN)
    }

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
