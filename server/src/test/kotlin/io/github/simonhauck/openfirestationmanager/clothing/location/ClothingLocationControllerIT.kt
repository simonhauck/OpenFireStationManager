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
}
