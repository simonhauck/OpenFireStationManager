package io.github.simonhauck.openfirestationmanager.clothing.checkout

import org.springframework.boot.resttestclient.TestRestTemplate
import org.springframework.boot.resttestclient.postForEntity
import org.springframework.http.HttpEntity
import org.springframework.http.HttpHeaders
import org.springframework.http.ProblemDetail
import org.springframework.http.ResponseEntity
import org.springframework.stereotype.Component

@Component
class CheckoutControllerCalls(private val testRestTemplate: TestRestTemplate) {

    fun checkout(
        request: CheckoutRequest,
        authCookie: String? = null,
    ): ResponseEntity<CheckoutHttpResponse> {
        return testRestTemplate.postForEntity<CheckoutHttpResponse>(
            "/api/clothing/checkouts",
            HttpEntity(request, headersWithCookie(authCookie)),
        )
    }

    fun checkoutExpectingError(
        request: CheckoutRequest,
        authCookie: String? = null,
    ): ResponseEntity<ProblemDetail> {
        return testRestTemplate.postForEntity<ProblemDetail>(
            "/api/clothing/checkouts",
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
