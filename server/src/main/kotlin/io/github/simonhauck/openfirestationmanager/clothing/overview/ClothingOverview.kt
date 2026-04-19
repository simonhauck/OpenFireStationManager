package io.github.simonhauck.openfirestationmanager.clothing.overview

data class SizeSummary(val size: String, val count: Int)

data class ClothingTypeSizeSummary(
    val typeId: Long,
    val typeName: String,
    val sizeCounts: List<SizeSummary>,
)

data class ClothingLocationSizeSummary(
    val locationId: Long,
    val locationName: String,
    val sizeCounts: List<SizeSummary>,
)

