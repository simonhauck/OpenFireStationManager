package io.github.simonhauck.openfirestationmanager.clothing.overview

import io.github.simonhauck.openfirestationmanager.clothing.item.ClothingItemRepository
import io.github.simonhauck.openfirestationmanager.clothing.location.ClothingLocationRepository
import io.github.simonhauck.openfirestationmanager.clothing.type.ClothingTypeRepository
import org.springframework.stereotype.Service

@Service
class ClothingOverviewService(
    private val clothingItemRepository: ClothingItemRepository,
    private val clothingLocationRepository: ClothingLocationRepository,
    private val clothingTypeRepository: ClothingTypeRepository,
) {

    fun getSummaryByTypeAndSize(): List<ClothingTypeSizeSummary> {
        val items = clothingItemRepository.findAll()
        return clothingTypeRepository
            .findAll()
            .sortedBy { it.id }
            .map { type ->
                val sizeCounts =
                    items
                        .asSequence()
                        .filter { item -> item.typeId.id == type.id }
                        .groupingBy { item -> item.size }
                        .eachCount()
                        .mapValues { (_, count) -> count.toLong() }
                        .toSortedMap()

                ClothingTypeSizeSummary(
                    typeId = type.id,
                    typeName = type.name,
                    sizeCounts = sizeCounts,
                )
            }
    }

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
