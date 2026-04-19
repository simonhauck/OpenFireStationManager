package io.github.simonhauck.openfirestationmanager.clothing.overview

import io.swagger.v3.oas.annotations.Operation
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/clothing/overview")
class ClothingOverviewController(private val service: ClothingOverviewService) {

    // TODO 19.04.26 - Simon.Hauck Adapt path to /summary/type
    @GetMapping("/summary")
    @Operation(summary = "List clothing item counts by type and size")
    fun getSummariesByType(): List<ClothingTypeSummary> = service.getSummariesByType()

    // TODO 19.04.26 - Simon.Hauck Adapt path to /dashboard/location
    @GetMapping
    @Operation(summary = "Get clothing availability overview for dashboard locations")
    fun getDashboardLocationSummaries(): List<ClothingLocationSummary> =
        service.getDashboardLocationSummaries()
}
