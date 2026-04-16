package io.github.simonhauck.openfirestationmanager.clothing.location

import org.springframework.boot.resttestclient.TestRestTemplate
import org.springframework.boot.resttestclient.exchange
import org.springframework.boot.resttestclient.postForEntity
import org.springframework.http.HttpEntity
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpMethod
import org.springframework.http.ResponseEntity
import org.springframework.stereotype.Component

@Component
class ClothingLocationControllerCalls(private val testRestTemplate: TestRestTemplate) {

    fun getAllLocations(authCookie: String? = null): ResponseEntity<Array<ClothingLocation>> {
        return testRestTemplate.exchange<Array<ClothingLocation>>(
            "/api/clothing/locations",
            HttpMethod.GET,
            HttpEntity<Unit>(headersWithCookie(authCookie)),
        )
    }

    fun getLocationById(id: Long, authCookie: String? = null): ResponseEntity<ClothingLocation> {
        return testRestTemplate.exchange<ClothingLocation>(
            "/api/clothing/locations/$id",
            HttpMethod.GET,
            HttpEntity<Unit>(headersWithCookie(authCookie)),
        )
    }

    fun createLocation(
        request: CreateClothingLocationRequest,
        authCookie: String? = null,
    ): ResponseEntity<ClothingLocation> {
        return testRestTemplate.postForEntity<ClothingLocation>(
            "/api/clothing/locations",
            HttpEntity(request, headersWithCookie(authCookie)),
        )
    }

    private fun headersWithCookie(authCookie: String?): HttpHeaders {
        val headers = HttpHeaders()
        if (authCookie != null) {
            headers.add(HttpHeaders.COOKIE, authCookie)
        }
        return headers
    }
}
