package io.github.simonhauck.openfirestationmanager.clothing.overview

import io.github.simonhauck.openfirestationmanager.common.ApiTags
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.responses.ApiResponse
import io.swagger.v3.oas.annotations.responses.ApiResponses
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/clothing/overview")
@Tag(name = ApiTags.CLOTHING_OVERVIEW)
class ClothingOverviewController(private val service: ClothingOverviewService) {

    @GetMapping("/summary/type")
    @Operation(
        operationId = "getClothingSummaryByType",
        summary = "Count garments across the whole station, grouped by type and size",
        description =
            "Aggregated stock across every location, answering \"how many jackets do we own, in " +
                "which sizes?\". Each type carries a `totalCount` and a breakdown into size " +
                "bands, so a long tail of individual sizes stays readable.\n\n" +
                "Counts include every garment regardless of where it is or whether it is " +
                "currently checked out. Use this for reporting rather than availability — for " +
                "what is on the shelf right now, use `getClothingDashboardByLocation`.",
    )
    @ApiResponses(ApiResponse(responseCode = "200", description = "Stock grouped by type."))
    fun getSummariesByType(): List<ClothingTypeSummary> = service.getSummariesByType()

    @GetMapping("/dashboard/location")
    @Operation(
        operationId = "getClothingDashboardByLocation",
        summary = "Show available stock per location, for the dashboard",
        description =
            "Stock broken down by location, then by type and size. This powers the station " +
                "dashboard's availability view.\n\n" +
                "Only locations of type `POOL` and `WAESCHE` are included — shared stock and " +
                "laundry. Personal lockers are deliberately excluded, so these figures represent " +
                "what is available to the station rather than everything it owns.",
    )
    @ApiResponses(
        ApiResponse(
            responseCode = "200",
            description = "Stock grouped by pool and laundry locations.",
        )
    )
    fun getDashboardLocationSummaries(): List<ClothingLocationSummary> =
        service.getDashboardLocationSummaries()
}
