package io.github.simonhauck.openfirestationmanager.testing

import io.github.simonhauck.openfirestationmanager.clothing.type.ClothingType
import io.github.simonhauck.openfirestationmanager.clothing.type.ClothingTypeService
import io.github.simonhauck.openfirestationmanager.clothing.type.CreateOrUpdateClothingTypeRequest
import io.github.simonhauck.openfirestationmanager.common.ApiTags
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.responses.ApiResponse
import io.swagger.v3.oas.annotations.responses.ApiResponses
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty
import org.springframework.validation.annotation.Validated
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

/**
 * Test-only seeding endpoints used by the Playwright suite to create fixtures without driving the
 * corresponding UI workflows. Only registered when `app.testing.enabled` is `true`, so they are
 * absent from the production profile. Each endpoint delegates to the production domain service with
 * the same request/response DTOs the real API uses.
 */
@RestController
@RequestMapping("/api/test")
@Validated
@ConditionalOnProperty(name = ["app.testing.enabled"], havingValue = "true")
@Tag(name = ApiTags.TEST)
class TestSeedingController(private val clothingTypeService: ClothingTypeService) {

    @PostMapping("/clothing-types")
    @Operation(
        operationId = "seedClothingType",
        summary = "Seed a clothing type",
        description =
            "Test-only fixture endpoint. Creates a clothing type through the same service the " +
                "production `POST /api/clothing/types` uses. Prefer this over driving the create " +
                "form in a browser. Available only with the test profile.",
    )
    @ApiResponses(ApiResponse(responseCode = "200", description = "The newly created type."))
    fun seedClothingType(
        @Valid @RequestBody request: CreateOrUpdateClothingTypeRequest
    ): ClothingType = clothingTypeService.createType(request)
}
