package io.github.simonhauck.openfirestationmanager.clothing.overview

import io.github.simonhauck.openfirestationmanager.clothing.item.ClothingItem
import io.github.simonhauck.openfirestationmanager.clothing.item.ClothingItemRepository
import io.github.simonhauck.openfirestationmanager.clothing.location.ClothingLocation
import io.github.simonhauck.openfirestationmanager.clothing.location.ClothingLocationRepository
import io.github.simonhauck.openfirestationmanager.clothing.location.LocationType
import io.github.simonhauck.openfirestationmanager.clothing.type.ClothingType
import io.github.simonhauck.openfirestationmanager.clothing.type.ClothingTypeRepository
import org.springframework.stereotype.Service
import kotlin.collections.sorted

@Service
class ClothingOverviewService(
    private val clothingItemRepository: ClothingItemRepository,
    private val clothingLocationRepository: ClothingLocationRepository,
    private val clothingTypeRepository: ClothingTypeRepository,
) {

    private val sizeGroupAggregator = SizeGroupAggregator()

    fun getSummariesByType(): List<ClothingTypeSummary> {
        val types = clothingTypeRepository.findAll().sortedBy { it.id }

        return types.map { type ->
            val relevantItems = clothingItemRepository.findAllByTypeId(type.getIdAsReference())
            val summary = summarizeBySize2(relevantItems)
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

    private fun summarizeBySize2(relevantItems: List<ClothingItem>): List<SizeGroupSummary> {
        return relevantItems.map { it.size }
            .let { sizeGroupAggregator.group(it) }

    }

    private fun summarizeBySize(relevantItems: List<ClothingItem>): List<SizeSummary> {
        return relevantItems
            .groupBy { item -> item.size }
            .mapValues { (_, items) -> items.count() }
            .map { (size, count) -> SizeSummary(size, count) }
    }
}
