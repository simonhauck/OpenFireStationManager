package io.github.simonhauck.openfirestationmanager.clothing.location

import io.github.simonhauck.openfirestationmanager.IntegrationTest
import io.github.simonhauck.openfirestationmanager.clothing.overview.ClothingOverviewControllerCalls
import io.github.simonhauck.openfirestationmanager.member.CreateOrUpdateMemberRequest
import io.github.simonhauck.openfirestationmanager.member.MemberControllerCalls
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.data.jdbc.core.mapping.AggregateReference
import org.springframework.http.HttpStatus

class ClothingLocationControllerIT : IntegrationTest() {

    @Autowired private lateinit var calls: ClothingLocationControllerCalls
    @Autowired private lateinit var overviewCalls: ClothingOverviewControllerCalls
    @Autowired private lateinit var memberCalls: MemberControllerCalls

    @Test
    fun `should create and read clothing locations`() {
        val uniqueName = "Location-${System.nanoTime()}"

        val createResponse =
            calls.createLocation(
                CreateClothingLocationRequest(
                    name = uniqueName,
                    comment = "Main storage",
                    onlyVisibleForKleiderwart = true,
                    type = LocationType.POOL,
                ),
                authCookie = validCookieHeader,
            )

        assertThat(createResponse.statusCode).isEqualTo(HttpStatus.OK)
        val created = createResponse.body!!
        assertThat(created.id).isGreaterThan(0)
        assertThat(created.name).isEqualTo(uniqueName)
        assertThat(created.comment).isEqualTo("Main storage")
        assertThat(created.onlyVisibleForKleiderwart).isTrue()
        assertThat(created.type).isEqualTo(LocationType.POOL)

        val byIdResponse = calls.getLocationById(created.id, authCookie = validCookieHeader)

        assertThat(byIdResponse.statusCode).isEqualTo(HttpStatus.OK)
        assertThat(byIdResponse.body?.id).isEqualTo(created.id)
        assertThat(byIdResponse.body?.name).isEqualTo(uniqueName)
        assertThat(byIdResponse.body?.type).isEqualTo(LocationType.POOL)

        val allResponse = calls.getAllLocations(authCookie = validCookieHeader)

        assertThat(allResponse.statusCode).isEqualTo(HttpStatus.OK)
        assertThat(allResponse.body?.map { it.id }).contains(created.id)
    }

    @Test
    fun `should create multiple locations in a batch`() {
        val suffix = System.nanoTime()
        val request =
            BatchCreateClothingLocationsRequest(
                items =
                    listOf(
                        CreateClothingLocationRequest(
                            name = "BatchLoc-A-$suffix",
                            comment = "First",
                            onlyVisibleForKleiderwart = false,
                            type = LocationType.POOL,
                        ),
                        CreateClothingLocationRequest(
                            name = "BatchLoc-B-$suffix",
                            comment = "Second",
                            onlyVisibleForKleiderwart = true,
                            type = LocationType.PERSONAL,
                        ),
                    )
            )

        val response = calls.createBatchLocations(request, authCookie = validCookieHeader)

        assertThat(response.statusCode).isEqualTo(HttpStatus.OK)
        val created = response.body!!
        assertThat(created).hasSize(2)
        assertThat(created.map { it.name })
            .containsExactlyInAnyOrder("BatchLoc-A-$suffix", "BatchLoc-B-$suffix")
        assertThat(created.all { it.id > 0 }).isTrue()
    }

    @Test
    fun `should update an existing clothing location`() {
        val created =
            calls
                .createLocation(
                    CreateClothingLocationRequest(
                        name = "Original-${System.nanoTime()}",
                        comment = "Old comment",
                        onlyVisibleForKleiderwart = false,
                        type = LocationType.OTHER,
                    ),
                    authCookie = validCookieHeader,
                )
                .body!!

        val updatedName = "Updated-${System.nanoTime()}"
        val updateResponse =
            calls.updateLocation(
                created.id,
                CreateClothingLocationRequest(
                    name = updatedName,
                    comment = "New comment",
                    onlyVisibleForKleiderwart = true,
                    type = LocationType.WAESCHE,
                ),
                authCookie = validCookieHeader,
            )

        assertThat(updateResponse.statusCode).isEqualTo(HttpStatus.OK)
        val updated = updateResponse.body!!
        assertThat(updated.id).isEqualTo(created.id)
        assertThat(updated.name).isEqualTo(updatedName)
        assertThat(updated.comment).isEqualTo("New comment")
        assertThat(updated.onlyVisibleForKleiderwart).isTrue()
        assertThat(updated.type).isEqualTo(LocationType.WAESCHE)
    }

    @Test
    fun `should assign and clear a member on a personal clothing location`() {
        val member =
            memberCalls
                .createMember(
                    CreateOrUpdateMemberRequest("Member-${System.nanoTime()}"),
                    authCookie = validCookieHeader,
                )
                .body!!

        val created =
            calls
                .createLocation(
                    CreateClothingLocationRequest(
                        name = "Personal-${System.nanoTime()}",
                        comment = "",
                        onlyVisibleForKleiderwart = false,
                        type = LocationType.PERSONAL,
                        memberId = AggregateReference.to(member.id),
                    ),
                    authCookie = validCookieHeader,
                )
                .body!!

        assertThat(created.memberId?.id).isEqualTo(member.id)
        assertThat(
                calls.getLocationById(created.id, authCookie = validCookieHeader).body?.memberId?.id
            )
            .isEqualTo(member.id)

        val cleared =
            calls
                .updateLocation(
                    created.id,
                    CreateClothingLocationRequest(
                        name = created.name,
                        comment = created.comment,
                        onlyVisibleForKleiderwart = created.onlyVisibleForKleiderwart,
                        type = LocationType.PERSONAL,
                        memberId = null,
                    ),
                    authCookie = validCookieHeader,
                )
                .body!!

        assertThat(cleared.memberId).isNull()
    }

    @Test
    fun `should reject assigning a member to a non-personal clothing location`() {
        val member =
            memberCalls
                .createMember(
                    CreateOrUpdateMemberRequest("Member-${System.nanoTime()}"),
                    authCookie = validCookieHeader,
                )
                .body!!

        LocationType.entries
            .filterNot { it == LocationType.PERSONAL }
            .forEach { type ->
                val response =
                    calls.createLocationExpectingError(
                        CreateClothingLocationRequest(
                            name = "Invalid-$type-${System.nanoTime()}",
                            comment = "",
                            onlyVisibleForKleiderwart = false,
                            type = type,
                            memberId = AggregateReference.to(member.id),
                        ),
                        authCookie = validCookieHeader,
                    )

                assertThat(response.statusCode).isEqualTo(HttpStatus.BAD_REQUEST)
            }
    }

    @Test
    fun `should reject changing an owned personal location to another type`() {
        val member =
            memberCalls
                .createMember(
                    CreateOrUpdateMemberRequest("Member-${System.nanoTime()}"),
                    authCookie = validCookieHeader,
                )
                .body!!
        val location =
            calls
                .createLocation(
                    CreateClothingLocationRequest(
                        name = "Owned-${System.nanoTime()}",
                        comment = "",
                        onlyVisibleForKleiderwart = false,
                        type = LocationType.PERSONAL,
                        memberId = AggregateReference.to(member.id),
                    ),
                    authCookie = validCookieHeader,
                )
                .body!!

        val response =
            calls.updateLocationExpectingError(
                location.id,
                CreateClothingLocationRequest(
                    name = location.name,
                    comment = location.comment,
                    onlyVisibleForKleiderwart = location.onlyVisibleForKleiderwart,
                    type = LocationType.POOL,
                    memberId = null,
                ),
                authCookie = validCookieHeader,
            )

        assertThat(response.statusCode).isEqualTo(HttpStatus.BAD_REQUEST)
        val unchanged = calls.getLocationById(location.id, authCookie = validCookieHeader).body!!
        assertThat(unchanged.type).isEqualTo(LocationType.PERSONAL)
        assertThat(unchanged.memberId?.id).isEqualTo(member.id)
    }

    @Test
    fun `deleting a member clears ownership from their clothing locations`() {
        val member =
            memberCalls
                .createMember(
                    CreateOrUpdateMemberRequest("Member-${System.nanoTime()}"),
                    authCookie = validCookieHeader,
                )
                .body!!
        val location =
            calls
                .createLocation(
                    CreateClothingLocationRequest(
                        name = "Owned-${System.nanoTime()}",
                        comment = "",
                        onlyVisibleForKleiderwart = false,
                        type = LocationType.PERSONAL,
                        memberId = AggregateReference.to(member.id),
                    ),
                    authCookie = validCookieHeader,
                )
                .body!!

        assertThat(memberCalls.deleteMember(member.id, authCookie = validCookieHeader).statusCode)
            .isEqualTo(HttpStatus.NO_CONTENT)

        val remaining = calls.getLocationById(location.id, authCookie = validCookieHeader)
        assertThat(remaining.statusCode).isEqualTo(HttpStatus.OK)
        assertThat(remaining.body?.memberId).isNull()
    }

    @Test
    fun `should delete an existing clothing location`() {
        val created =
            calls
                .createLocation(
                    CreateClothingLocationRequest(
                        name = "ToDelete-${System.nanoTime()}",
                        comment = "",
                        onlyVisibleForKleiderwart = false,
                        type = LocationType.OTHER,
                    ),
                    authCookie = validCookieHeader,
                )
                .body!!

        val deleteResponse = calls.deleteLocation(created.id, authCookie = validCookieHeader)

        assertThat(deleteResponse.statusCode).isEqualTo(HttpStatus.NO_CONTENT)
    }

    @Test
    fun `dashboard summary includes POOL and WAESCHE locations but not PERSONAL or OTHER`() {
        val suffix = System.nanoTime()

        // Create one of each type
        val pool =
            calls
                .createLocation(
                    CreateClothingLocationRequest(
                        "DashPool-$suffix",
                        "",
                        onlyVisibleForKleiderwart = false,
                        type = LocationType.POOL,
                    ),
                    authCookie = validCookieHeader,
                )
                .body!!

        val waesche =
            calls
                .createLocation(
                    CreateClothingLocationRequest(
                        "DashWaesche-$suffix",
                        "",
                        onlyVisibleForKleiderwart = false,
                        type = LocationType.WAESCHE,
                    ),
                    authCookie = validCookieHeader,
                )
                .body!!

        val personal =
            calls
                .createLocation(
                    CreateClothingLocationRequest(
                        "DashPersonal-$suffix",
                        "",
                        onlyVisibleForKleiderwart = false,
                        type = LocationType.PERSONAL,
                    ),
                    authCookie = validCookieHeader,
                )
                .body!!

        val other =
            calls
                .createLocation(
                    CreateClothingLocationRequest(
                        "DashOther-$suffix",
                        "",
                        onlyVisibleForKleiderwart = false,
                        type = LocationType.OTHER,
                    ),
                    authCookie = validCookieHeader,
                )
                .body!!

        val dashboardResponse =
            overviewCalls.getDashboardLocationSummaries(authCookie = validCookieHeader)

        assertThat(dashboardResponse.statusCode).isEqualTo(HttpStatus.OK)
        val locationIds = dashboardResponse.body!!.map { it.locationId }
        assertThat(locationIds).contains(pool.id, waesche.id)
        assertThat(locationIds).doesNotContain(personal.id, other.id)
    }
}
