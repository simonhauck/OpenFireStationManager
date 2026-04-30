package io.github.simonhauck.openfirestationmanager.clothing.item

import io.github.simonhauck.openfirestationmanager.IntegrationTest
import io.github.simonhauck.openfirestationmanager.clothing.location.ClothingLocation
import io.github.simonhauck.openfirestationmanager.clothing.location.ClothingLocationControllerCalls
import io.github.simonhauck.openfirestationmanager.clothing.location.CreateClothingLocationRequest
import io.github.simonhauck.openfirestationmanager.clothing.location.LocationType
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
import org.springframework.boot.resttestclient.TestRestTemplate
import org.springframework.boot.resttestclient.exchange
import org.springframework.data.jdbc.core.mapping.AggregateReference
import org.springframework.http.HttpEntity
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpMethod
import org.springframework.http.HttpStatus
import org.springframework.http.ProblemDetail
import org.springframework.http.ResponseEntity

class ClothingItemLookupIT : IntegrationTest() {

    @Autowired private lateinit var itemCalls: ClothingItemControllerCalls
    @Autowired private lateinit var typeCalls: ProtectiveClothingTypeControllerCalls
    @Autowired private lateinit var locationCalls: ClothingLocationControllerCalls
    @Autowired private lateinit var adminUserCalls: AdminUserControllerCalls
    @Autowired private lateinit var testRestTemplate: TestRestTemplate

    // --- by-barcode ---

    @Test
    fun `by-barcode returns ResolvedClothingItem for a known barcode`() {
        val type = createType()
        val location = createLocation(LocationType.POOL)
        val barcode = "BARCODE-${System.nanoTime()}"
        itemCalls.createItem(
            CreateOrUpdateClothingItemRequest(
                typeId = type.id,
                size = "L",
                barcode = barcode,
                locationId = AggregateReference.to(location.id),
            ),
            authCookie = validCookieHeader,
        )

        val response = getByBarcode(barcode, validCookieHeader)

        assertThat(response.statusCode).isEqualTo(HttpStatus.OK)
        assertThat(response.body?.barcode).isEqualTo(barcode)
        assertThat(response.body?.typeName).isEqualTo(type.name)
        assertThat(response.body?.size).isEqualTo("L")
        assertThat(response.body?.currentLocationId).isEqualTo(location.id)
        assertThat(response.body?.currentLocationName).isEqualTo(location.name)
        assertThat(response.body?.currentLocationType).isEqualTo(LocationType.POOL)
    }

    @Test
    fun `by-barcode returns 404 for an unknown barcode`() {
        val response = getByBarcodeExpectingError("UNKNOWN-${System.nanoTime()}", validCookieHeader)

        assertThat(response.statusCode).isEqualTo(HttpStatus.NOT_FOUND)
    }

    @Test
    fun `by-barcode returns 404 for item at Kleiderwart-only location when caller is not Kleiderwart`() {
        val type = createType()
        val restrictedLocation = createLocation(LocationType.PERSONAL, onlyVisibleForKleiderwart = true)
        val barcode = "RESTRICTED-${System.nanoTime()}"
        itemCalls.createItem(
            CreateOrUpdateClothingItemRequest(
                typeId = type.id,
                size = "M",
                barcode = barcode,
                locationId = AggregateReference.to(restrictedLocation.id),
            ),
            authCookie = validCookieHeader,
        )

        val regularUserCookie = createRegularUserCookie()
        val response = getByBarcodeExpectingError(barcode, regularUserCookie)

        assertThat(response.statusCode).isEqualTo(HttpStatus.NOT_FOUND)
    }

    // --- search ---

    @Test
    fun `search matches items by type name (case-insensitive)`() {
        val uniqueName = "SearchType-${System.nanoTime()}"
        val type = createType(uniqueName)
        itemCalls.createItem(
            CreateOrUpdateClothingItemRequest(typeId = type.id, size = "XL"),
            authCookie = validCookieHeader,
        )

        val response = search(uniqueName.lowercase(), validCookieHeader)

        assertThat(response.statusCode).isEqualTo(HttpStatus.OK)
        assertThat(response.body?.map { it.typeName }).contains(uniqueName)
    }

    @Test
    fun `search matches items by size (case-insensitive)`() {
        val type = createType()
        val uniqueSize = "size-${System.nanoTime()}"
        itemCalls.createItem(
            CreateOrUpdateClothingItemRequest(typeId = type.id, size = uniqueSize),
            authCookie = validCookieHeader,
        )

        val response = search(uniqueSize.uppercase(), validCookieHeader)

        assertThat(response.statusCode).isEqualTo(HttpStatus.OK)
        assertThat(response.body?.map { it.size }).contains(uniqueSize)
    }

    @Test
    fun `search matches items by barcode (case-insensitive contains)`() {
        val type = createType()
        val uniqueBarcode = "BC-${System.nanoTime()}"
        itemCalls.createItem(
            CreateOrUpdateClothingItemRequest(typeId = type.id, size = "S", barcode = uniqueBarcode),
            authCookie = validCookieHeader,
        )

        val response = search(uniqueBarcode.lowercase(), validCookieHeader)

        assertThat(response.statusCode).isEqualTo(HttpStatus.OK)
        assertThat(response.body?.map { it.barcode }).contains(uniqueBarcode)
    }

    @Test
    fun `search hard-caps results at 50 regardless of limit parameter`() {
        val type = createType()
        // Create 55 items to exceed the cap
        repeat(55) {
            itemCalls.createItem(
                CreateOrUpdateClothingItemRequest(typeId = type.id, size = "CAP-TEST-${System.nanoTime()}"),
                authCookie = validCookieHeader,
            )
        }

        val response = search(type.name, validCookieHeader, limit = 100)

        assertThat(response.statusCode).isEqualTo(HttpStatus.OK)
        assertThat(response.body?.size).isLessThanOrEqualTo(50)
    }

    @Test
    fun `search filters out items at Kleiderwart-only locations for non-Kleiderwart callers`() {
        val type = createType()
        val restrictedLocation = createLocation(LocationType.PERSONAL, onlyVisibleForKleiderwart = true)
        val uniqueBarcode = "FILTERED-${System.nanoTime()}"
        itemCalls.createItem(
            CreateOrUpdateClothingItemRequest(
                typeId = type.id,
                size = "M",
                barcode = uniqueBarcode,
                locationId = AggregateReference.to(restrictedLocation.id),
            ),
            authCookie = validCookieHeader,
        )

        val regularUserCookie = createRegularUserCookie()
        val response = search(uniqueBarcode, regularUserCookie)

        assertThat(response.statusCode).isEqualTo(HttpStatus.OK)
        assertThat(response.body?.map { it.barcode }).doesNotContain(uniqueBarcode)
    }

    // --- helpers ---

    private fun getByBarcode(
        barcode: String,
        authCookie: String?,
    ): ResponseEntity<ResolvedClothingItem> {
        return testRestTemplate.exchange<ResolvedClothingItem>(
            "/api/clothing/items/by-barcode/$barcode",
            HttpMethod.GET,
            HttpEntity<Unit>(headersWithCookie(authCookie)),
        )
    }

    private fun getByBarcodeExpectingError(
        barcode: String,
        authCookie: String?,
    ): ResponseEntity<ProblemDetail> {
        return testRestTemplate.exchange<ProblemDetail>(
            "/api/clothing/items/by-barcode/$barcode",
            HttpMethod.GET,
            HttpEntity<Unit>(headersWithCookie(authCookie)),
        )
    }

    private fun search(
        q: String,
        authCookie: String?,
        limit: Int = 50,
    ): ResponseEntity<Array<ResolvedClothingItem>> {
        return testRestTemplate.exchange<Array<ResolvedClothingItem>>(
            "/api/clothing/items/search?q=$q&limit=$limit",
            HttpMethod.GET,
            HttpEntity<Unit>(headersWithCookie(authCookie)),
        )
    }

    private fun createRegularUserCookie(): String {
        val username = "user-${System.nanoTime()}"
        val password = "pass1234"
        adminUserCalls.createUser(
            CreateUserRequest(
                username = username,
                password = password,
                firstName = "Regular",
                lastName = "User",
                roles = listOf(UserRole.USER),
            ),
            authCookie = validCookieHeader,
        )
        val authCalls = AuthControllerCalls(testRestTemplate)
        val loginResponse = authCalls.login(username = username, password = password)
        return authCalls.extractAuthCookie(loginResponse)
            ?: error("Login failed for $username")
    }

    private fun createLocation(
        type: LocationType,
        name: String = "Loc-${System.nanoTime()}",
        onlyVisibleForKleiderwart: Boolean = false,
    ): ClothingLocation {
        return locationCalls
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
    }

    private fun createType(name: String = "Type-${System.nanoTime()}"): ClothingType {
        return typeCalls
            .createType(
                CreateOrUpdateClothingTypeRequest(name = name),
                authCookie = validCookieHeader,
            )
            .body!!
    }

    private fun headersWithCookie(authCookie: String?): HttpHeaders {
        val headers = HttpHeaders()
        if (authCookie != null) headers.add(HttpHeaders.COOKIE, authCookie)
        return headers
    }
}
