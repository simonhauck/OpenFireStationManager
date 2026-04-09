package io.github.simonhauck.openfirestationmanager.clothing.location

import io.github.simonhauck.openfirestationmanager.IntegrationTest
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.http.HttpStatus

class ClothingLocationControllerIT : IntegrationTest() {

    @Autowired private lateinit var calls: ClothingLocationControllerCalls

    @Test
    fun `createLocation should create a new clothing location when authenticated`() {
        val request =
            CreateOrUpdateClothingLocationRequest(
                name = "Spind A",
                comment = "Erster Spind links",
                onlyVisibleForKleiderwart = false,
                shouldBeShownOnDashboard = true,
            )

        val response = calls.createLocation(request, authCookie = validCookieHeader)

        assertThat(response.statusCode).isEqualTo(HttpStatus.OK)
        assertThat(response.body?.name).isEqualTo("Spind A")
        assertThat(response.body?.comment).isEqualTo("Erster Spind links")
        assertThat(response.body?.onlyVisibleForKleiderwart).isFalse()
        assertThat(response.body?.shouldBeShownOnDashboard).isTrue()
        assertThat(response.body?.id).isGreaterThan(0)
    }

    @Test
    fun `getLocationById should return the location when it exists`() {
        val created =
            calls
                .createLocation(
                    CreateOrUpdateClothingLocationRequest(name = "Lager-${System.nanoTime()}"),
                    authCookie = validCookieHeader,
                )
                .body!!

        val response = calls.getLocationById(created.id, authCookie = validCookieHeader)

        assertThat(response.statusCode).isEqualTo(HttpStatus.OK)
        assertThat(response.body?.id).isEqualTo(created.id)
        assertThat(response.body?.name).isEqualTo(created.name)
    }

    @Test
    fun `updateLocation should update an existing clothing location`() {
        val created =
            calls
                .createLocation(
                    CreateOrUpdateClothingLocationRequest(name = "Alt-${System.nanoTime()}"),
                    authCookie = validCookieHeader,
                )
                .body!!

        val response =
            calls.updateLocation(
                created.id,
                CreateOrUpdateClothingLocationRequest(
                    name = "Neu",
                    comment = "Neuer Kommentar",
                    onlyVisibleForKleiderwart = true,
                    shouldBeShownOnDashboard = false,
                ),
                authCookie = validCookieHeader,
            )

        assertThat(response.statusCode).isEqualTo(HttpStatus.OK)
        assertThat(response.body?.id).isEqualTo(created.id)
        assertThat(response.body?.name).isEqualTo("Neu")
        assertThat(response.body?.comment).isEqualTo("Neuer Kommentar")
        assertThat(response.body?.onlyVisibleForKleiderwart).isTrue()
        assertThat(response.body?.shouldBeShownOnDashboard).isFalse()
    }

    @Test
    fun `deleteLocation should delete an existing clothing location`() {
        val created =
            calls
                .createLocation(
                    CreateOrUpdateClothingLocationRequest(name = "ToDelete-${System.nanoTime()}"),
                    authCookie = validCookieHeader,
                )
                .body!!

        val deleteResponse = calls.deleteLocation(created.id, authCookie = validCookieHeader)

        assertThat(deleteResponse.statusCode).isEqualTo(HttpStatus.NO_CONTENT)
    }

    @Test
    fun `getAllLocations should include created locations`() {
        val uniqueName = "Location-${System.nanoTime()}"
        calls.createLocation(
            CreateOrUpdateClothingLocationRequest(name = uniqueName),
            authCookie = validCookieHeader,
        )

        val response = calls.getAllLocations(authCookie = validCookieHeader)

        assertThat(response.statusCode).isEqualTo(HttpStatus.OK)
        assertThat(response.body?.map { it.name }).contains(uniqueName)
    }
}
