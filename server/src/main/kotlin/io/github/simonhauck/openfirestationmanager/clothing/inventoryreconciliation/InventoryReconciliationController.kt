package io.github.simonhauck.openfirestationmanager.clothing.inventoryreconciliation

import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.media.Content
import io.swagger.v3.oas.annotations.media.Schema
import io.swagger.v3.oas.annotations.responses.ApiResponse
import jakarta.validation.Valid
import org.springframework.http.ProblemDetail
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.validation.annotation.Validated
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/clothing/inventory-reconciliation/{locationId}")
@Validated
class InventoryReconciliationController(private val service: InventoryReconciliationService) {

    @PostMapping("/preview")
    @PreAuthorize("hasRole('ROLE_KLEIDERWART')")
    @Operation(summary = "Preview the diff between scanned items and system records for a location")
    @ApiResponse(responseCode = "200", description = "OK")
    @ApiResponse(
        responseCode = "400",
        description = "Bad Request",
        content = [Content(schema = Schema(implementation = ProblemDetail::class))],
    )
    @ApiResponse(
        responseCode = "403",
        description = "Forbidden — KLEIDERWART role required",
        content = [Content(schema = Schema(implementation = ProblemDetail::class))],
    )
    @ApiResponse(
        responseCode = "404",
        description = "Location or item not found",
        content = [Content(schema = Schema(implementation = ProblemDetail::class))],
    )
    fun preview(
        @PathVariable locationId: Long,
        @Valid @RequestBody request: InventoryReconciliationPreviewRequest,
    ): InventoryReconciliationPreviewResponse {
        return service.preview(locationId, request)
    }

    @PostMapping("/execute")
    @PreAuthorize("hasRole('ROLE_KLEIDERWART')")
    @Operation(
        summary = "Execute the inventory reconciliation, applying the changes from the preview"
    )
    @ApiResponse(responseCode = "200", description = "OK")
    @ApiResponse(
        responseCode = "400",
        description = "Bad Request",
        content = [Content(schema = Schema(implementation = ProblemDetail::class))],
    )
    @ApiResponse(
        responseCode = "403",
        description = "Forbidden — KLEIDERWART role required",
        content = [Content(schema = Schema(implementation = ProblemDetail::class))],
    )
    @ApiResponse(
        responseCode = "404",
        description = "Location or item not found",
        content = [Content(schema = Schema(implementation = ProblemDetail::class))],
    )
    fun execute(
        @PathVariable locationId: Long,
        @Valid @RequestBody request: InventoryReconciliationPreviewResponse,
    ): InventoryReconciliationExecuteResponse {
        return service.execute(locationId, request)
    }
}
