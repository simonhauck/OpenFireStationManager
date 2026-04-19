package io.github.simonhauck.openfirestationmanager.clothing.overview

import io.github.simonhauck.openfirestationmanager.IntegrationTest
import io.github.simonhauck.openfirestationmanager.clothing.item.ClothingItemControllerCalls
import io.github.simonhauck.openfirestationmanager.clothing.item.CreateOrUpdateClothingItemRequest
import io.github.simonhauck.openfirestationmanager.clothing.location.ClothingLocation
import io.github.simonhauck.openfirestationmanager.clothing.location.ClothingLocationControllerCalls
import io.github.simonhauck.openfirestationmanager.clothing.location.CreateClothingLocationRequest
import io.github.simonhauck.openfirestationmanager.clothing.type.ClothingType
import io.github.simonhauck.openfirestationmanager.clothing.type.CreateOrUpdateClothingTypeRequest
import io.github.simonhauck.openfirestationmanager.clothing.type.ProtectiveClothingTypeControllerCalls
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.data.jdbc.core.mapping.AggregateReference
import org.springframework.http.HttpStatus

class ClothingOverviewControllerIT : IntegrationTest() {

    @Autowired private lateinit var overviewCalls: ClothingOverviewControllerCalls

    @Autowired private lateinit var itemCalls: ClothingItemControllerCalls

    @Autowired private lateinit var typeCalls: ProtectiveClothingTypeControllerCalls

    @Autowired private lateinit var locationCalls: ClothingLocationControllerCalls

    @Test
    fun `getSummaryByTypeAndSize should group counts by clothing type and size`() {
        val summaryTypeName = "Summary-Type-${System.nanoTime()}"
        val type = createType(summaryTypeName)
        itemCalls.createItem(
            CreateOrUpdateClothingItemRequest(typeId = type.id, size = "M"),
            authCookie = validCookieHeader,
        )
        itemCalls.createItem(
            CreateOrUpdateClothingItemRequest(typeId = type.id, size = "M"),
            authCookie = validCookieHeader,
        )
        itemCalls.createItem(
            CreateOrUpdateClothingItemRequest(typeId = type.id, size = "L"),
            authCookie = validCookieHeader,
        )

        val response = overviewCalls.getSummaryByTypeAndSize(authCookie = validCookieHeader)

        assertThat(response.statusCode).isEqualTo(HttpStatus.OK)

        val summaryForType = response.body?.firstOrNull { it.typeId == type.id }
        assertThat(summaryForType).isNotNull
        assertThat(summaryForType?.typeName).isEqualTo(summaryTypeName)
        assertThat(summaryForType?.sizeCounts).contains(SizeSummary("M", 2)).contains(SizeSummary("L", 1))
    }

    @Test
    fun `getOverview should return size counts grouped by size for dashboard locations only`() {
        val type = createType()
        val dashboardLocation = createLocation(shouldBeShownOnDashboard = true)
        val hiddenLocation = createLocation(shouldBeShownOnDashboard = false)

        itemCalls.createItem(
            CreateOrUpdateClothingItemRequest(
                typeId = type.id,
                size = "M",
                locationId = AggregateReference.to(dashboardLocation.id),
            ),
            authCookie = validCookieHeader,
        )
        itemCalls.createItem(
            CreateOrUpdateClothingItemRequest(
                typeId = type.id,
                size = "M",
                locationId = AggregateReference.to(dashboardLocation.id),
            ),
            authCookie = validCookieHeader,
        )
        itemCalls.createItem(
            CreateOrUpdateClothingItemRequest(
                typeId = type.id,
                size = "L",
                locationId = AggregateReference.to(dashboardLocation.id),
            ),
            authCookie = validCookieHeader,
        )

        val response = overviewCalls.getOverview(authCookie = validCookieHeader)

        assertThat(response.statusCode).isEqualTo(HttpStatus.OK)

        val locationIds = response.body?.map { it.locationId } ?: emptyList()
        assertThat(locationIds).contains(dashboardLocation.id)
        assertThat(locationIds).doesNotContain(hiddenLocation.id)

        val summaryForLocation = response.body?.firstOrNull { it.locationId == dashboardLocation.id }
        assertThat(summaryForLocation).isNotNull
        assertThat(summaryForLocation?.locationName).isEqualTo(dashboardLocation.name)
        assertThat(summaryForLocation?.sizeCounts).contains(SizeSummary("M", 2)).contains(SizeSummary("L", 1))
    }

    private fun createLocation(
        name: String = "Location-${System.nanoTime()}",
        shouldBeShownOnDashboard: Boolean = false,
    ): ClothingLocation {
        return locationCalls
            .createLocation(
                CreateClothingLocationRequest(
                    name = name,
                    comment = "",
                    onlyVisibleForKleiderwart = false,
                    shouldBeShownOnDashboard = shouldBeShownOnDashboard,
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
