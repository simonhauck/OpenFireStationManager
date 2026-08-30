package io.github.simonhauck.openfirestationmanager.clothing.item

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
import org.springframework.http.HttpStatus
import org.springframework.http.ProblemDetail
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.security.core.Authentication
import org.springframework.validation.annotation.Validated
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PatchMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/clothing/items")
@Validated
@Tag(name = ApiTags.CLOTHING_ITEMS)
class ClothingItemController(
    private val service: ClothingItemService,
    private val lookupService: ClothingItemLookupService,
) {

    @GetMapping
    @Operation(
        operationId = "listClothingItems",
        summary = "List every clothing item",
        description =
            "Returns all clothing items in the station, unfiltered and unpaginated. Each item is " +
                "returned in its raw form: `typeId` and `locationId` are numeric references, not " +
                "expanded objects. To get the type and location names alongside each item, use " +
                "`searchClothingItems` or `getClothingItemByBarcode` instead, which return the " +
                "resolved form.\n\n" +
                "Unlike the search and barcode endpoints, this endpoint does **not** hide items " +
                "stored in locations flagged `onlyVisibleForKleiderwart`.",
    )
    fun getAllItems(): List<ClothingItem> = service.getAllItems()

    @GetMapping("/{id}")
    @Operation(
        operationId = "getClothingItem",
        summary = "Get one clothing item by its numeric id",
        description =
            "Looks up a single clothing item by its database id. Returns the raw item, whose " +
                "`typeId` and `locationId` are numeric references rather than expanded objects.\n\n" +
                "If you are scanning a physical garment, prefer `getClothingItemByBarcode`.",
    )
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "The clothing item."),
        ApiResponse(
            responseCode = "404",
            description = "No clothing item exists with this id.",
            content =
                [
                    Content(
                        mediaType = "application/problem+json",
                        schema = Schema(implementation = ProblemDetail::class),
                    )
                ],
        ),
    )
    fun getItemById(
        @Parameter(description = "Numeric id of the clothing item.", example = "42")
        @PathVariable
        @Positive
        id: Long
    ): ClothingItem = service.getItemById(id)

    @GetMapping("/by-barcode/{barcode}")
    @Operation(
        operationId = "getClothingItemByBarcode",
        summary = "Look up a clothing item by its barcode",
        description =
            "Resolves the barcode printed on a physical garment to the item it identifies. This " +
                "is the endpoint to use when a scanner is involved.\n\n" +
                "The response is the **resolved** form: it embeds the full clothing type and the " +
                "full current location alongside the item, so no follow-up lookups are needed. " +
                "`location` is null when the item is not currently assigned anywhere.\n\n" +
                "Barcodes are unique across all items. Callers without the `KLEIDERWART` role " +
                "cannot resolve items held in locations flagged `onlyVisibleForKleiderwart`; for " +
                "them such an item reads as not found.",
    )
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "The resolved clothing item."),
        ApiResponse(
            responseCode = "404",
            description =
                "No item carries this barcode, or the item is in a location the caller may not see.",
            content =
                [
                    Content(
                        mediaType = "application/problem+json",
                        schema = Schema(implementation = ProblemDetail::class),
                    )
                ],
        ),
    )
    fun getItemByBarcode(
        @Parameter(
            description = "Barcode exactly as printed on the garment.",
            example = "1234567890128",
        )
        @PathVariable
        barcode: String,
        authentication: Authentication,
    ): ResolvedClothingItem =
        lookupService.findByBarcode(barcode, isKleiderwart = authentication.isKleiderwart())

    @GetMapping("/search")
    @Operation(
        operationId = "searchClothingItems",
        summary = "Search clothing items by type name, size, or barcode",
        description =
            "Free-text search across the clothing type name, the size, and the barcode. Use this " +
                "to answer questions like \"which jackets in size 52 do we have?\" — pass the " +
                "type name and the size together as one query string.\n\n" +
                "Results are returned in **resolved** form, each embedding its full clothing type " +
                "and current location. Callers without the `KLEIDERWART` role never see items " +
                "held in locations flagged `onlyVisibleForKleiderwart`.\n\n" +
                "The result set is capped at 50 entries regardless of the `limit` supplied, so a " +
                "full result set is never guaranteed; narrow the query rather than raising the limit.",
    )
    fun searchItems(
        @Parameter(
            description =
                "Search term matched against clothing type name, size, and barcode. Required, and " +
                    "must not be blank.",
            example = "Einsatzjacke 52",
        )
        @RequestParam
        q: String,
        @Parameter(
            description =
                "Maximum number of results to return. Values above the server-side cap of 50 are " +
                    "silently reduced to 50.",
            example = "50",
        )
        @RequestParam(defaultValue = "50")
        limit: Int,
        authentication: Authentication,
    ): List<ResolvedClothingItem> =
        lookupService.search(q, limit, isKleiderwart = authentication.isKleiderwart())

    @PostMapping
    @Operation(
        operationId = "createClothingItem",
        summary = "Register a new clothing item",
        description =
            "Creates one physical garment. The `typeId` must reference an existing clothing type; " +
                "create the type first if it does not exist yet.\n\n" +
                "`locationId` is optional — an item created without one is unassigned and will " +
                "not appear in any location's stock until it is moved. Supplying one records an " +
                "`INITIAL_PLACEMENT` movement. A blank `barcode` is normalised to null rather " +
                "than stored as an empty string.\n\n" +
                "Returns `200 OK` with the created item, including its assigned `id`. This API " +
                "deliberately does not use `201 Created`.",
    )
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "The newly created clothing item."),
        ApiResponse(
            responseCode = "409",
            description = "Another item already carries this barcode.",
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
    fun createItem(@Valid @RequestBody request: CreateOrUpdateClothingItemRequest): ClothingItem =
        service.createItem(request)

    @PostMapping("/batch")
    @Operation(
        operationId = "createClothingItemsBatch",
        summary = "Register many clothing items in one request",
        description =
            "Creates several garments at once — the usual way to record a newly delivered box of " +
                "identical items. Each entry is validated and created exactly as it would be by " +
                "`createClothingItem`.\n\n" +
                "The whole batch is applied in a single transaction: if any one entry is " +
                "rejected, none of them are created.",
    )
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "The newly created clothing items."),
        ApiResponse(
            responseCode = "409",
            description = "A barcode in the batch is already taken, or repeated within the batch.",
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
    fun createBatchItems(
        @Valid @RequestBody request: BatchCreateClothingItemsRequest
    ): List<ClothingItem> = service.createBatchItems(request.items)

    @PatchMapping("/{id}")
    @Operation(
        operationId = "updateClothingItem",
        summary = "Replace the details of a clothing item",
        description =
            "Despite the `PATCH` verb this is a **full replacement**: every field of the request " +
                "body is applied, and any optional field you omit is reset to null. Read the item " +
                "first and resend the fields you want to keep.\n\n" +
                "Changing `locationId` records a movement with reason `MANUAL_CORRECTION` (or " +
                "`INITIAL_PLACEMENT` if the item had no location before). Clearing `locationId` " +
                "to null records **nothing** — the item silently becomes unassigned. For moving " +
                "garments as part of normal operations, prefer `checkoutClothingItems` or " +
                "`relocateClothingItems`, which capture intent more precisely.",
    )
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "The updated clothing item."),
        ApiResponse(
            responseCode = "404",
            description = "No clothing item exists with this id.",
            content =
                [
                    Content(
                        mediaType = "application/problem+json",
                        schema = Schema(implementation = ProblemDetail::class),
                    )
                ],
        ),
        ApiResponse(
            responseCode = "409",
            description = "Another item already carries this barcode.",
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
    fun updateItem(
        @Parameter(description = "Numeric id of the clothing item to replace.", example = "42")
        @PathVariable
        @Positive
        id: Long,
        @Valid @RequestBody request: CreateOrUpdateClothingItemRequest,
    ): ClothingItem = service.updateItem(id, request)

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(
        operationId = "deleteClothingItem",
        summary = "Permanently delete a clothing item",
        description =
            "Removes a garment from the inventory entirely — use this when an item is discarded " +
                "or lost, not when it is merely returned or moved.\n\n" +
                "This is irreversible and succeeds regardless of where the item currently is. " +
                "Returns an empty `204 No Content` body.",
    )
    @ApiResponses(
        ApiResponse(responseCode = "204", description = "The item was deleted."),
        ApiResponse(
            responseCode = "404",
            description = "No clothing item exists with this id.",
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
    fun deleteItem(
        @Parameter(description = "Numeric id of the clothing item to delete.", example = "42")
        @PathVariable
        @Positive
        id: Long
    ) {
        service.deleteItem(id)
    }
}

private fun Authentication.isKleiderwart(): Boolean = authorities.any {
    it.authority == "ROLE_KLEIDERWART"
}
