package io.github.simonhauck.openfirestationmanager.clothing.overview

import io.github.simonhauck.openfirestationmanager.clothing.item.ClothingItemRepository
import io.github.simonhauck.openfirestationmanager.clothing.location.ClothingLocationRepository
import org.springframework.stereotype.Service

@Service
class ClothingOverviewService(
    private val clothingItemRepository: ClothingItemRepository,
    private val clothingLocationRepository: ClothingLocationRepository,
) {

    fun getOverviewForDashboardLocations(): List<ClothingLocationSizeSummary> {
        val items = clothingItemRepository.findAll()
        return clothingLocationRepository
            .findAll()
            .filter { it.shouldBeShownOnDashboard }
            .sortedBy { it.id }
            .map { location ->
                val sizeCounts =
                    items
                        .asSequence()
                        .filter { item -> item.locationId?.id == location.id }
                        .groupingBy { item -> item.size }
                        .eachCount()
                        .mapValues { (_, count) -> count.toLong() }
                        .toSortedMap()

                ClothingLocationSizeSummary(
                    locationId = location.id,
                    locationName = location.name,
                    sizeCounts = sizeCounts,
                )
            }
    }
}
