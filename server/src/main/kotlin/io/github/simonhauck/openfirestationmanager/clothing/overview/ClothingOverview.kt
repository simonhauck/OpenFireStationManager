package io.github.simonhauck.openfirestationmanager.clothing.overview

data class SizeSummary(val size: String, val count: Int)

data class ClothingTypeSummary(
    val typeId: Long,
    val typeName: String,
    val sizeCounts: List<SizeSummary>,
)

data class ClothingLocationSummary(
    val locationId: Long,
    val locationName: String,
    val types: List<ClothingTypeSummary>,
)
