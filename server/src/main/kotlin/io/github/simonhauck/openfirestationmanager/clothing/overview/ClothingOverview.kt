package io.github.simonhauck.openfirestationmanager.clothing.overview

data class ClothingTypeSizeSummary(
    val typeId: Long,
    val typeName: String,
    val sizeCounts: Map<String, Long>,
)

data class ClothingLocationSizeSummary(
    val locationId: Long,
    val locationName: String,
    val sizeCounts: Map<String, Long>,
)
