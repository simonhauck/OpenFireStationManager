package io.github.simonhauck.openfirestationmanager.clothing.overview

data class ClothingLocationSizeSummary(
    val locationId: Long,
    val locationName: String,
    val sizeCounts: Map<String, Long>,
)
