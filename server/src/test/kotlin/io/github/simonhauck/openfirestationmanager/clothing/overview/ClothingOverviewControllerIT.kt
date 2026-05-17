package io.github.simonhauck.openfirestationmanager.clothing.overview

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
import org.springframework.http.HttpStatus

class ClothingOverviewControllerIT : IntegrationTest() {

    @Autowired private lateinit var overviewCalls: ClothingOverviewControllerCalls

    @Autowired private lateinit var itemCalls: ClothingItemControllerCalls

    @Autowired private lateinit var typeCalls: ProtectiveClothingTypeControllerCalls

    @Autowired private lateinit var locationCalls: ClothingLocationControllerCalls

    @Test
    fun `getSummariesByType should group counts by clothing type and size`() {
        val summaryTypeName = "Summary-Type-${System.nanoTime()}"
        val type = createType(summaryTypeName)
        itemCalls.createItem(
            CreateOrUpdateClothingItemRequest(typeId = type.id, size = "3XL-2"),
            authCookie = validCookieHeader,
        )

        val response = overviewCalls.getSummariesByType(authCookie = validCookieHeader)

        assertThat(response.statusCode).isEqualTo(HttpStatus.OK)

        val summaryForType = response.body?.firstOrNull { it.typeId == type.id }
        val expected =
            ClothingTypeSummary(
                typeId = type.id,
                typeName = summaryTypeName,
                sizeGroupSummary =
                    listOf(
                        SizeGroupSummary(
                            name = "XXXL",
                            sizes = listOf(SizeSummary(size = "3XL-2", count = 1)),
                        )
                    ),
            )
        assertThat(summaryForType).isEqualTo(expected)
    }

    @Test
    fun `getDashboardLocationSummaries should return type and size summaries for dashboard locations only`() {
        val type = createType()
        val poolLocation = createLocation(type = LocationType.POOL)
        val hiddenLocation = createLocation(type = LocationType.OTHER)

        itemCalls.createItem(
            CreateOrUpdateClothingItemRequest(
                typeId = type.id,
                size = "M",
                locationId = poolLocation.getIdAsReference(),
            ),
            authCookie = validCookieHeader,
        )

        val response = overviewCalls.getDashboardLocationSummaries(authCookie = validCookieHeader)

        assertThat(response.statusCode).isEqualTo(HttpStatus.OK)

        val locationIds = response.body?.map { it.locationId } ?: emptyList()
        assertThat(locationIds).contains(poolLocation.id)
        assertThat(locationIds).doesNotContain(hiddenLocation.id)

        val summaryForLocation = response.body?.firstOrNull { it.locationId == poolLocation.id }
        assertThat(summaryForLocation?.locationId).isEqualTo(poolLocation.id)

        assertThat(summaryForLocation?.types)
            .contains(
                ClothingTypeSummary(
                    typeId = type.id,
                    typeName = type.name,
                    sizeGroupSummary =
                        listOf(
                            SizeGroupSummary(
                                name = "M",
                                sizes = listOf(SizeSummary(size = "M", count = 1)),
                            )
                        ),
                )
            )
    }

    private fun createLocation(
        name: String = "Location-${System.nanoTime()}",
        type: LocationType = LocationType.OTHER,
    ): ClothingLocation {
        return locationCalls
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
