package io.github.simonhauck.openfirestationmanager.clothing.type

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
@RequestMapping("/api/clothing/types")
@Validated
class ClothingTypeController(private val service: ClothingTypeService) {

    @GetMapping
    @Operation(summary = "List all protective clothing types")
    fun getAllTypes(): List<ClothingType> = service.getAllTypes()

    @GetMapping("/{id}")
    @Operation(summary = "Get a protective clothing type by ID")
    fun getTypeById(
        @Parameter(description = "ID of the protective clothing type")
        @PathVariable
        @Positive
        id: Long
    ): ClothingType = service.getTypeById(id)

    @PostMapping
    @Operation(summary = "Create a new protective clothing type")
    @PreAuthorize("hasRole('ROLE_KLEIDERWART')")
    fun createType(@Valid @RequestBody request: CreateOrUpdateClothingTypeRequest): ClothingType =
        service.createType(request)

    @PatchMapping("/{id}")
    @PreAuthorize("hasRole('ROLE_KLEIDERWART')")
    @Operation(summary = "Update a protective clothing type")
    fun updateType(
        @Parameter(description = "ID of the protective clothing type")
        @PathVariable
        @Positive
        id: Long,
        @Valid @RequestBody request: CreateOrUpdateClothingTypeRequest,
    ): ClothingType = service.updateType(id, request)

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('ROLE_KLEIDERWART')")
    @Operation(summary = "Delete a protective clothing type")
    fun deleteType(
        @Parameter(description = "ID of the protective clothing type")
        @PathVariable
        @Positive
        id: Long
    ) {
        service.deleteType(id)
    }
}
