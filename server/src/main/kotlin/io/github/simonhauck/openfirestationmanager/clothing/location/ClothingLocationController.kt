package io.github.simonhauck.openfirestationmanager.clothing.location

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
import org.springframework.validation.annotation.Validated
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PatchMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/clothing/locations")
@Validated
@Tag(name = ApiTags.CLOTHING_LOCATIONS)
class ClothingLocationController(private val service: ClothingLocationService) {

    @GetMapping
    @Operation(
        operationId = "listClothingLocations",
        summary = "List every clothing location",
        description =
            "Returns all places garments can be kept (`Standort`), including personal lockers, " +
                "the shared pool, and the laundry. Start here to discover valid `locationId` " +
                "values for checkout, relocation, and reconciliation.\n\n" +
                "This endpoint returns locations flagged `onlyVisibleForKleiderwart` to every " +
                "caller; it is the item lookups, not this list, that apply that visibility rule.",
    )
    fun getAllLocations(): List<ClothingLocation> = service.getAllLocations()

    @GetMapping("/{id}")
    @Operation(
        operationId = "getClothingLocation",
        summary = "Get one clothing location by its numeric id",
        description =
            "Looks up a single location by its database id. This returns the location's own " +
                "properties only — it does not list the garments currently stored there. To find " +
                "those, use `searchClothingItems`.",
    )
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "The clothing location."),
        ApiResponse(
            responseCode = "404",
            description = "No clothing location exists with this id.",
            content =
                [
                    Content(
                        mediaType = "application/problem+json",
                        schema = Schema(implementation = ProblemDetail::class),
                    )
                ],
        ),
    )
    fun getLocationById(
        @Parameter(description = "Numeric id of the clothing location.", example = "7")
        @PathVariable
        @Positive
        id: Long
    ): ClothingLocation = service.getLocationById(id)

    @PostMapping
    @Operation(
        operationId = "createClothingLocation",
        summary = "Create a new clothing location",
        description =
            "Registers a new place where garments can be kept. Choose the `type` carefully: it " +
                "determines whether the location behaves as shared stock (`POOL`), as a laundry " +
                "staging area (`WAESCHE`), or as one member's personal storage (`PERSONAL`).",
    )
    @ApiResponses(ApiResponse(responseCode = "200", description = "The newly created location."))
    @PreAuthorize("hasRole('ROLE_KLEIDERWART')")
    fun createLocation(
        @Valid @RequestBody request: CreateClothingLocationRequest
    ): ClothingLocation = service.createLocation(request)

    @PostMapping("/batch")
    @Operation(
        operationId = "createClothingLocationsBatch",
        summary = "Create many clothing locations in one request",
        description =
            "Creates several locations at once — the usual way to set up a whole row of lockers " +
                "in a single call.",
    )
    @ApiResponses(ApiResponse(responseCode = "200", description = "The newly created locations."))
    @PreAuthorize("hasRole('ROLE_KLEIDERWART')")
    fun createBatchLocations(
        @Valid @RequestBody request: BatchCreateClothingLocationsRequest
    ): List<ClothingLocation> = service.createBatchLocations(request.items)

    @PatchMapping("/{id}")
    @Operation(
        operationId = "updateClothingLocation",
        summary = "Replace the details of a clothing location",
        description =
            "Despite the `PATCH` verb this is a **full replacement**: `name`, `comment`, `type`, " +
                "and `onlyVisibleForKleiderwart` are all applied from the request body. Read the " +
                "location first and resend the fields you want to keep.\n\n" +
                "Garments stored here are unaffected and stay where they are.",
    )
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "The updated location."),
        ApiResponse(
            responseCode = "404",
            description = "No clothing location exists with this id.",
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
    fun updateLocation(
        @Parameter(description = "Numeric id of the clothing location to replace.", example = "7")
        @PathVariable
        @Positive
        id: Long,
        @Valid @RequestBody request: CreateClothingLocationRequest,
    ): ClothingLocation = service.updateLocation(id, request)

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(
        operationId = "deleteClothingLocation",
        summary = "Delete a clothing location",
        description =
            "Removes a place from the station. Move any garments still stored here first — " +
                "deleting a location does not delete or relocate its contents, and items left " +
                "pointing at it become hard to find.",
    )
    @ApiResponses(
        ApiResponse(responseCode = "204", description = "The location was deleted."),
        ApiResponse(
            responseCode = "404",
            description = "No clothing location exists with this id.",
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
    fun deleteLocation(
        @Parameter(description = "Numeric id of the clothing location to delete.", example = "7")
        @PathVariable
        @Positive
        id: Long
    ) {
        service.deleteLocation(id)
    }
}
