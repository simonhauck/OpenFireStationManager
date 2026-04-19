package io.github.simonhauck.openfirestationmanager.clothing.location

import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.Parameter
import jakarta.validation.Valid
import jakarta.validation.constraints.Positive
import org.springframework.http.HttpStatus
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
class ClothingLocationController(private val service: ClothingLocationService) {
    //
    @GetMapping
    @Operation(summary = "List all clothing locations")
    fun getAllLocations(): List<ClothingLocation> = service.getAllLocations()

    @GetMapping("/{id}")
    @Operation(summary = "Get a clothing location by ID")
    fun getLocationById(
        @Parameter(description = "ID of the clothing location") @PathVariable @Positive id: Long
    ): ClothingLocation = service.getLocationById(id)

    @PostMapping
    @Operation(summary = "Create a new clothing location")
    @PreAuthorize("hasRole('ROLE_KLEIDERWART')")
    fun createLocation(
        @Valid @RequestBody request: CreateClothingLocationRequest
    ): ClothingLocation = service.createLocation(request)

    @PostMapping("/batch")
    @Operation(summary = "Create multiple clothing locations in a single request")
    @PreAuthorize("hasRole('ROLE_KLEIDERWART')")
    fun createBatchLocations(
        @Valid @RequestBody request: BatchCreateClothingLocationsRequest
    ): List<ClothingLocation> = service.createBatchLocations(request.items)

    @PatchMapping("/{id}")
    @Operation(summary = "Update a clothing location")
    @PreAuthorize("hasRole('ROLE_KLEIDERWART')")
    fun updateLocation(
        @Parameter(description = "ID of the clothing location") @PathVariable @Positive id: Long,
        @Valid @RequestBody request: CreateClothingLocationRequest,
    ): ClothingLocation = service.updateLocation(id, request)

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('ROLE_KLEIDERWART')")
    @Operation(summary = "Delete a clothing location")
    fun deleteLocation(
        @Parameter(description = "ID of the clothing location") @PathVariable @Positive id: Long
    ) {
        service.deleteLocation(id)
    }
}
