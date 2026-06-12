package io.github.simonhauck.openfirestationmanager.clothing.inventoryreconciliation

import org.springframework.boot.resttestclient.TestRestTemplate
import org.springframework.boot.resttestclient.postForEntity
import org.springframework.http.HttpEntity
import org.springframework.http.HttpHeaders
import org.springframework.http.ProblemDetail
import org.springframework.http.ResponseEntity
import org.springframework.stereotype.Component

@Component
class InventoryReconciliationControllerCalls(private val testRestTemplate: TestRestTemplate) {

    fun preview(
        locationId: Long,
        request: InventoryReconciliationPreviewRequest,
        authCookie: String? = null,
    ): ResponseEntity<InventoryReconciliationPreviewResponse> {
        return testRestTemplate.postForEntity(
            "/api/clothing/inventory-reconciliation/$locationId/preview",
            HttpEntity(request, headersWithCookie(authCookie)),
        )
    }

    fun previewExpectingError(
        locationId: Long,
        request: InventoryReconciliationPreviewRequest,
        authCookie: String? = null,
    ): ResponseEntity<ProblemDetail> {
        return testRestTemplate.postForEntity(
            "/api/clothing/inventory-reconciliation/$locationId/preview",
            HttpEntity(request, headersWithCookie(authCookie)),
        )
    }

    fun execute(
        locationId: Long,
        request: InventoryReconciliationPreviewResponse,
        authCookie: String? = null,
    ): ResponseEntity<InventoryReconciliationExecuteResponse> {
        return testRestTemplate.postForEntity(
            "/api/clothing/inventory-reconciliation/$locationId/execute",
            HttpEntity(request, headersWithCookie(authCookie)),
        )
    }

    fun executeExpectingError(
        locationId: Long,
        request: InventoryReconciliationPreviewResponse,
        authCookie: String? = null,
    ): ResponseEntity<ProblemDetail> {
        return testRestTemplate.postForEntity(
            "/api/clothing/inventory-reconciliation/$locationId/execute",
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
