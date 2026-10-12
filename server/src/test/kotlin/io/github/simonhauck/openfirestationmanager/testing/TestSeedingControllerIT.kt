package io.github.simonhauck.openfirestationmanager.testing

import io.github.simonhauck.openfirestationmanager.IntegrationTest
import io.github.simonhauck.openfirestationmanager.clothing.item.ClothingItem
import io.github.simonhauck.openfirestationmanager.clothing.item.CreateOrUpdateClothingItemRequest
import io.github.simonhauck.openfirestationmanager.clothing.location.ClothingLocation
import io.github.simonhauck.openfirestationmanager.clothing.location.CreateClothingLocationRequest
import io.github.simonhauck.openfirestationmanager.clothing.location.LocationType
import io.github.simonhauck.openfirestationmanager.clothing.type.ClothingType
import io.github.simonhauck.openfirestationmanager.clothing.type.CreateOrUpdateClothingTypeRequest
import io.github.simonhauck.openfirestationmanager.member.CreateOrUpdateMemberRequest
import io.github.simonhauck.openfirestationmanager.member.Member
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.springframework.boot.resttestclient.postForEntity
import org.springframework.data.jdbc.core.mapping.AggregateReference
import org.springframework.http.HttpStatus

class TestSeedingControllerIT : IntegrationTest() {

    @Test
    fun `seedClothingType should create a type without authentication`() {
        val name = "SeedType-${System.nanoTime()}"

        val response =
            http.postForEntity<ClothingType>(
                "/api/test/clothing-types",
                CreateOrUpdateClothingTypeRequest(name = name),
            )

        assertThat(response.statusCode).isEqualTo(HttpStatus.OK)
        assertThat(response.body?.id).isGreaterThan(0)
        assertThat(response.body?.name).isEqualTo(name)
    }

    @Test
    fun `seedClothingLocation should create a location without authentication`() {
        val name = "SeedLocation-${System.nanoTime()}"

        val response =
            http.postForEntity<ClothingLocation>(
                "/api/test/clothing-locations",
                CreateClothingLocationRequest(
                    name = name,
                    comment = "",
                    onlyVisibleForKleiderwart = false,
                    type = LocationType.POOL,
                ),
            )

        assertThat(response.statusCode).isEqualTo(HttpStatus.OK)
        assertThat(response.body?.id).isGreaterThan(0)
        assertThat(response.body?.name).isEqualTo(name)
        assertThat(response.body?.type).isEqualTo(LocationType.POOL)
    }

    @Test
    fun `seedClothingItem should create an item placed at the seeded location`() {
        val type =
            http
                .postForEntity<ClothingType>(
                    "/api/test/clothing-types",
                    CreateOrUpdateClothingTypeRequest(name = "SeedItemType-${System.nanoTime()}"),
                )
                .body!!
        val location =
            http
                .postForEntity<ClothingLocation>(
                    "/api/test/clothing-locations",
                    CreateClothingLocationRequest(
                        name = "SeedItemLocation-${System.nanoTime()}",
                        comment = "",
                        onlyVisibleForKleiderwart = false,
                        type = LocationType.POOL,
                    ),
                )
                .body!!

        val response =
            http.postForEntity<ClothingItem>(
                "/api/test/clothing-items",
                CreateOrUpdateClothingItemRequest(
                    typeId = type.id,
                    size = "52",
                    barcode = "seed-${System.nanoTime()}",
                    locationId = AggregateReference.to(location.id),
                ),
            )

        assertThat(response.statusCode).isEqualTo(HttpStatus.OK)
        assertThat(response.body?.id).isGreaterThan(0)
        assertThat(response.body?.typeId?.id).isEqualTo(type.id)
        assertThat(response.body?.locationId?.id).isEqualTo(location.id)
    }

    @Test
    fun `seedMember should create a member without authentication`() {
        val name = "SeedMember-${System.nanoTime()}"

        val response =
            http.postForEntity<Member>(
                "/api/test/members",
                CreateOrUpdateMemberRequest(name = name),
            )

        assertThat(response.statusCode).isEqualTo(HttpStatus.OK)
        assertThat(response.body?.id).isGreaterThan(0)
        assertThat(response.body?.name).isEqualTo(name)
    }
}
