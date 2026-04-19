package io.github.simonhauck.openfirestationmanager.clothing.location

import io.github.simonhauck.openfirestationmanager.IntegrationTest
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.http.HttpStatus

class ClothingLocationControllerIT : IntegrationTest() {

    @Autowired private lateinit var calls: ClothingLocationControllerCalls

    @Test
    fun `should create and read clothing locations`() {
        val uniqueName = "Location-${System.nanoTime()}"

        val createResponse =
            calls.createLocation(
                CreateClothingLocationRequest(
                    name = uniqueName,
                    comment = "Main storage",
                    onlyVisibleForKleiderwart = true,
                    shouldBeShownOnDashboard = false,
                ),
                authCookie = validCookieHeader,
            )

        assertThat(createResponse.statusCode).isEqualTo(HttpStatus.OK)
        val created = createResponse.body!!
        assertThat(created.id).isGreaterThan(0)
        assertThat(created.name).isEqualTo(uniqueName)
        assertThat(created.comment).isEqualTo("Main storage")
        assertThat(created.onlyVisibleForKleiderwart).isTrue()
        assertThat(created.shouldBeShownOnDashboard).isFalse()

        val byIdResponse = calls.getLocationById(created.id, authCookie = validCookieHeader)

        assertThat(byIdResponse.statusCode).isEqualTo(HttpStatus.OK)
        assertThat(byIdResponse.body?.id).isEqualTo(created.id)
        assertThat(byIdResponse.body?.name).isEqualTo(uniqueName)

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
                            shouldBeShownOnDashboard = true,
                        ),
                        CreateClothingLocationRequest(
                            name = "BatchLoc-B-$suffix",
                            comment = "Second",
                            onlyVisibleForKleiderwart = true,
                            shouldBeShownOnDashboard = false,
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
                        shouldBeShownOnDashboard = false,
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
                    shouldBeShownOnDashboard = true,
                ),
                authCookie = validCookieHeader,
            )

        assertThat(updateResponse.statusCode).isEqualTo(HttpStatus.OK)
        val updated = updateResponse.body!!
        assertThat(updated.id).isEqualTo(created.id)
        assertThat(updated.name).isEqualTo(updatedName)
        assertThat(updated.comment).isEqualTo("New comment")
        assertThat(updated.onlyVisibleForKleiderwart).isTrue()
        assertThat(updated.shouldBeShownOnDashboard).isTrue()
    }
}
