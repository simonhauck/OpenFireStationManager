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

    fun getSummaryByTypeAndSize(
        authCookie: String? = null
    ): ResponseEntity<Array<ClothingTypeSizeSummary>> {
        return testRestTemplate.exchange<Array<ClothingTypeSizeSummary>>(
            "/api/clothing/overview/summary",
            HttpMethod.GET,
            HttpEntity<Unit>(headersWithCookie(authCookie)),
        )
    }

    fun getOverview(
        authCookie: String? = null
    ): ResponseEntity<Array<ClothingLocationSizeSummary>> {
        return testRestTemplate.exchange<Array<ClothingLocationSizeSummary>>(
            "/api/clothing/overview",
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
