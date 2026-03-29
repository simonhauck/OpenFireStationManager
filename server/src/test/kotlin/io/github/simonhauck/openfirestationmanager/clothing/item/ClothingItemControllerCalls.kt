package io.github.simonhauck.openfirestationmanager.clothing.item

import org.springframework.boot.resttestclient.TestRestTemplate
import org.springframework.boot.resttestclient.exchange
import org.springframework.boot.resttestclient.postForEntity
import org.springframework.http.HttpEntity
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpMethod
import org.springframework.http.ProblemDetail
import org.springframework.http.ResponseEntity
import org.springframework.stereotype.Component

@Component
class ClothingItemControllerCalls(private val testRestTemplate: TestRestTemplate) {

    fun getSummaryByTypeAndSize(
        authCookie: String? = null
    ): ResponseEntity<Array<ClothingTypeSizeSummary>> {
        return testRestTemplate.exchange<Array<ClothingTypeSizeSummary>>(
            "/api/clothing/items/summary",
            HttpMethod.GET,
            HttpEntity<Unit>(headersWithCookie(authCookie)),
        )
    }

    fun getAllItems(authCookie: String? = null): ResponseEntity<Array<ClothingItem>> {
        return testRestTemplate.exchange<Array<ClothingItem>>(
            "/api/clothing/items",
            HttpMethod.GET,
            HttpEntity<Unit>(headersWithCookie(authCookie)),
        )
    }

    fun getAllItemsExpectingError(authCookie: String? = null): ResponseEntity<ProblemDetail> {
        return testRestTemplate.exchange<ProblemDetail>(
            "/api/clothing/items",
            HttpMethod.GET,
            HttpEntity<Unit>(headersWithCookie(authCookie)),
        )
    }

    fun getItemById(id: Long, authCookie: String? = null): ResponseEntity<ClothingItem> {
        return testRestTemplate.exchange<ClothingItem>(
            "/api/clothing/items/$id",
            HttpMethod.GET,
            HttpEntity<Unit>(headersWithCookie(authCookie)),
        )
    }

    fun getItemByIdExpectingError(
        id: Long,
        authCookie: String? = null,
    ): ResponseEntity<ProblemDetail> {
        return testRestTemplate.exchange<ProblemDetail>(
            "/api/clothing/items/$id",
            HttpMethod.GET,
            HttpEntity<Unit>(headersWithCookie(authCookie)),
        )
    }

    fun createItem(
        request: CreateOrUpdateClothingItemRequest,
        authCookie: String? = null,
    ): ResponseEntity<ClothingItem> {
        return testRestTemplate.postForEntity<ClothingItem>(
            "/api/clothing/items",
            HttpEntity(request, headersWithCookie(authCookie)),
        )
    }

    fun createItemExpectingError(
        request: CreateOrUpdateClothingItemRequest,
        authCookie: String? = null,
    ): ResponseEntity<ProblemDetail> {
        return testRestTemplate.postForEntity<ProblemDetail>(
            "/api/clothing/items",
            HttpEntity(request, headersWithCookie(authCookie)),
        )
    }

    fun updateItem(
        id: Long,
        request: CreateOrUpdateClothingItemRequest,
        authCookie: String? = null,
    ): ResponseEntity<ClothingItem> {
        return testRestTemplate.exchange<ClothingItem>(
            "/api/clothing/items/$id",
            HttpMethod.PATCH,
            HttpEntity(request, headersWithCookie(authCookie)),
        )
    }

    fun updateItemExpectingError(
        id: Long,
        request: CreateOrUpdateClothingItemRequest,
        authCookie: String? = null,
    ): ResponseEntity<ProblemDetail> {
        return testRestTemplate.exchange<ProblemDetail>(
            "/api/clothing/items/$id",
            HttpMethod.PATCH,
            HttpEntity(request, headersWithCookie(authCookie)),
        )
    }

    fun deleteItem(id: Long, authCookie: String? = null): ResponseEntity<Void> {
        return testRestTemplate.exchange<Void>(
            "/api/clothing/items/$id",
            HttpMethod.DELETE,
            HttpEntity<Unit>(headersWithCookie(authCookie)),
        )
    }

    fun deleteItemExpectingError(
        id: Long,
        authCookie: String? = null,
    ): ResponseEntity<ProblemDetail> {
        return testRestTemplate.exchange<ProblemDetail>(
            "/api/clothing/items/$id",
            HttpMethod.DELETE,
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
