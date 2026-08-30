package io.github.simonhauck.openfirestationmanager.clothing.inventoryreconciliation

import io.github.simonhauck.openfirestationmanager.common.ApiTags
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.Parameter
import io.swagger.v3.oas.annotations.media.Content
import io.swagger.v3.oas.annotations.media.Schema
import io.swagger.v3.oas.annotations.responses.ApiResponse
import io.swagger.v3.oas.annotations.responses.ApiResponses
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import jakarta.validation.constraints.Positive
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
@Tag(name = ApiTags.CLOTHING_INVENTORY)
class InventoryReconciliationController(private val service: InventoryReconciliationService) {

    @PostMapping("/preview")
    @Operation(
        operationId = "previewInventoryReconciliation",
        summary = "Compare a scanned stock-take against the recorded contents of a location",
        description =
            "First of the two steps of a stock-take (`Inventarisierung`). Send the ids of every " +
                "garment physically present at the location; the response classifies the " +
                "difference without changing anything.\n\n" +
                "Scanned items already recorded here come back as `unchangedItems`. Scanned " +
                "items the system thought were elsewhere come back as `foundItems`. Items " +
                "recorded here but not scanned come back as `missingItems`.\n\n" +
                "This call is read-only and safe to repeat. Nothing is applied until you pass " +
                "the result to `executeInventoryReconciliation`.",
    )
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "The classified difference."),
        ApiResponse(
            responseCode = "404",
            description = "The location, or one of the scanned item ids, does not exist.",
            content =
                [
                    Content(
                        mediaType = "application/problem+json",
                        schema = Schema(implementation = ProblemDetail::class),
                    )
                ],
        ),
    )
    @PreAuthorize("hasRole('ROLE_KLEIDERWART')")
    fun preview(
        @Parameter(description = "Numeric id of the location being stock-taken.", example = "7")
        @PathVariable
        @Positive
        locationId: Long,
        @Valid @RequestBody request: InventoryReconciliationPreviewRequest,
    ): InventoryReconciliationPreviewResponse {
        return service.preview(locationId, request)
    }

    @PostMapping("/execute")
    @Operation(
        operationId = "executeInventoryReconciliation",
        summary = "Apply the outcome of a stock-take",
        description =
            "Second of the two steps of a stock-take. The request body is the response from " +
                "`previewInventoryReconciliation` — pass it back unchanged to apply exactly what " +
                "the preview described.\n\n" +
                "You may edit the body first, and doing so is the intended way to correct a " +
                "scan. Dropping an entry from `missingItems` leaves that garment recorded here " +
                "untouched; dropping one from `foundItems` leaves it where it was.\n\n" +
                "Applying moves every `foundItems` entry into this location and clears the " +
                "location of every `missingItems` entry, leaving those garments unassigned rather " +
                "than relocated. `unchangedItems` is only counted. All changes are written in one " +
                "transaction under a single batch id, with reason `INVENTORY_RECONCILIATION`.\n\n" +
                "The server does not re-verify the classification, so a stale body applies stale " +
                "decisions. Preview again if the stock may have moved in the meantime.",
    )
    @ApiResponses(
        ApiResponse(
            responseCode = "200",
            description = "The reconciliation was applied. The body summarises what changed.",
        ),
        ApiResponse(
            responseCode = "404",
            description = "The location, or one of the referenced items, does not exist.",
            content =
                [
                    Content(
                        mediaType = "application/problem+json",
                        schema = Schema(implementation = ProblemDetail::class),
                    )
                ],
        ),
    )
    @PreAuthorize("hasRole('ROLE_KLEIDERWART')")
    fun execute(
        @Parameter(description = "Numeric id of the location being stock-taken.", example = "7")
        @PathVariable
        @Positive
        locationId: Long,
        @Valid @RequestBody request: InventoryReconciliationPreviewResponse,
    ): InventoryReconciliationExecuteResponse {
        return service.execute(locationId, request)
    }
}
