package io.github.simonhauck.openfirestationmanager.clothing.overview

import org.springframework.boot.resttestclient.TestRestTemplate
import org.springframework.boot.resttestclient.exchange
import org.springframework.http.HttpEntity
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpMethod
import org.springframework.http.ResponseEntity
import org.springframework.stereotype.Component

@Component
class ClothingOverviewControllerCalls(private val testRestTemplate: TestRestTemplate) {

    fun getSummariesByType(authCookie: String? = null): ResponseEntity<Array<ClothingTypeSummary>> {
        return testRestTemplate.exchange<Array<ClothingTypeSummary>>(
            "/api/clothing/overview/summary/type",
            HttpMethod.GET,
            HttpEntity<Unit>(headersWithCookie(authCookie)),
        )
    }

    fun getDashboardLocationSummaries(
        authCookie: String? = null
    ): ResponseEntity<Array<ClothingLocationSummary>> {
        return testRestTemplate.exchange<Array<ClothingLocationSummary>>(
            "/api/clothing/overview/dashboard/location",
            HttpMethod.GET,
            HttpEntity<Unit>(headersWithCookie(authCookie)),
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
