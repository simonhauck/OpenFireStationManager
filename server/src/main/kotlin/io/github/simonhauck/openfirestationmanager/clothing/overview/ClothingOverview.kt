package io.github.simonhauck.openfirestationmanager.clothing.overview

data class SizeSummary(val size: String, val count: Int)

data class SizeGroupSummary(val name: String, val sizes: List<SizeSummary>)

data class ClothingTypeSummary(
    val typeId: Long,
    val typeName: String,
    val sizeCounts: List<SizeGroupSummary>,
)

data class ClothingLocationSummary(
    val locationId: Long,
    val locationName: String,
    val types: List<ClothingTypeSummary>,
)
