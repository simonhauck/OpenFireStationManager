package io.github.simonhauck.openfirestationmanager.clothing.overview

import io.github.oshai.kotlinlogging.KotlinLogging
import io.github.simonhauck.openfirestationmanager.clothing.item.ClothingItem
import io.github.simonhauck.openfirestationmanager.clothing.item.ClothingItemRepository
import io.github.simonhauck.openfirestationmanager.clothing.location.ClothingLocation
import io.github.simonhauck.openfirestationmanager.clothing.location.ClothingLocationRepository
import io.github.simonhauck.openfirestationmanager.clothing.location.LocationType
import io.github.simonhauck.openfirestationmanager.clothing.type.ClothingType
import io.github.simonhauck.openfirestationmanager.clothing.type.ClothingTypeRepository
import org.springframework.stereotype.Service

@Service
class ClothingOverviewService(
    private val clothingItemRepository: ClothingItemRepository,
    private val clothingLocationRepository: ClothingLocationRepository,
    private val clothingTypeRepository: ClothingTypeRepository,
) {

    private val log = KotlinLogging.logger {}
    private val sizeGroupAggregator = SizeGroupAggregator()

    fun getSummariesByType(): List<ClothingTypeSummary> {
        log.info { "Summarize by type service" }
        log.atInfo {
            message = "test log with payload"
            payload = mapOf("key" to "value")
        }
        val types = clothingTypeRepository.findAll().sortedBy { it.id }

        return types.map { type ->
            val relevantItems = clothingItemRepository.findAllByTypeId(type.getIdAsReference())
            val summary = summarizeBySize(relevantItems)
            ClothingTypeSummary(type.id, type.name, summary)
        }
    }

    fun getDashboardLocationSummaries(): List<ClothingLocationSummary> {
        val types = clothingTypeRepository.findAll()

        return clothingLocationRepository
            .findAllByTypeIn(listOf(LocationType.POOL, LocationType.WAESCHE))
            .sortedBy { it.id }
            .map { location ->
                ClothingLocationSummary(
                    location.id,
                    location.name,
                    types = types.map { type -> buildSummaryForLocationAndType(location, type) },
                )
            }
    }

    private fun buildSummaryForLocationAndType(
        location: ClothingLocation,
        type: ClothingType,
    ): ClothingTypeSummary {
        val relevantItems =
            clothingItemRepository.findAllByTypeIdAndLocationId(
                type.getIdAsReference(),
                location.getIdAsReference(),
            )
        val sizeSummaries = summarizeBySize(relevantItems)

        return ClothingTypeSummary(type.id, type.name, sizeSummaries)
    }

    private fun summarizeBySize(relevantItems: List<ClothingItem>): List<SizeGroupSummary> {
        return relevantItems.map { it.size }.let { sizeGroupAggregator.group(it) }
    }
}
