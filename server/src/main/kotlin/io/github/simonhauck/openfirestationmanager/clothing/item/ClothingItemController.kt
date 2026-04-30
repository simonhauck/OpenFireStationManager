package io.github.simonhauck.openfirestationmanager.clothing.item

import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.Parameter
import jakarta.validation.Valid
import jakarta.validation.constraints.Positive
import org.springframework.http.HttpStatus
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
class ClothingItemController(
    private val service: ClothingItemService,
    private val lookupService: ClothingItemLookupService,
) {

    @GetMapping
    @Operation(summary = "List all clothing items")
    fun getAllItems(): List<ClothingItem> = service.getAllItems()

    @GetMapping("/{id}")
    @Operation(summary = "Get a clothing item by ID")
    fun getItemById(
        @Parameter(description = "ID of the clothing item") @PathVariable @Positive id: Long
    ): ClothingItem = service.getItemById(id)

    @GetMapping("/by-barcode/{barcode}")
    @Operation(summary = "Look up a clothing item by barcode")
    fun getItemByBarcode(
        @PathVariable barcode: String,
        authentication: Authentication,
    ): ResolvedClothingItem =
        lookupService.findByBarcode(barcode, isKleiderwart = authentication.isKleiderwart())

    @GetMapping("/search")
    @Operation(summary = "Search clothing items by type name, size, or barcode")
    fun searchItems(
        @RequestParam q: String,
        @RequestParam(defaultValue = "50") limit: Int,
        authentication: Authentication,
    ): List<ResolvedClothingItem> =
        lookupService.search(q, limit, isKleiderwart = authentication.isKleiderwart())

    @PostMapping
    @Operation(summary = "Create a new clothing item")
    @PreAuthorize("hasRole('ROLE_KLEIDERWART')")
    fun createItem(@Valid @RequestBody request: CreateOrUpdateClothingItemRequest): ClothingItem =
        service.createItem(request)

    @PostMapping("/batch")
    @Operation(summary = "Create multiple clothing items in a single request")
    @PreAuthorize("hasRole('ROLE_KLEIDERWART')")
    fun createBatchItems(
        @Valid @RequestBody request: BatchCreateClothingItemsRequest
    ): List<ClothingItem> = service.createBatchItems(request.items)

    @PatchMapping("/{id}")
    @Operation(summary = "Update a clothing item")
    @PreAuthorize("hasRole('ROLE_KLEIDERWART')")
    fun updateItem(
        @Parameter(description = "ID of the clothing item") @PathVariable @Positive id: Long,
        @Valid @RequestBody request: CreateOrUpdateClothingItemRequest,
    ): ClothingItem = service.updateItem(id, request)

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Delete a clothing item")
    @PreAuthorize("hasRole('ROLE_KLEIDERWART')")
    fun deleteItem(
        @Parameter(description = "ID of the clothing item") @PathVariable @Positive id: Long
    ) {
        service.deleteItem(id)
    }
}

private fun Authentication.isKleiderwart(): Boolean =
    authorities.any { it.authority == "ROLE_KLEIDERWART" }
