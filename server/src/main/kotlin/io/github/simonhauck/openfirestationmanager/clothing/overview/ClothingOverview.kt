package io.github.simonhauck.openfirestationmanager.clothing.overview

data class SizeSummary(val size: String, val count: Int)

data class SizeGroupSummary(val name: String, val sizes: List<SizeSummary>) {
    val totalCount = sizes.sumOf { it.count }
}

data class ClothingTypeSummary(
    val typeId: Long,
    val typeName: String,
    val sizeGroupSummary: List<SizeGroupSummary>,
) {
    val totalCount = sizeGroupSummary.sumOf { it.totalCount }
}

data class ClothingLocationSummary(
    val locationId: Long,
    val locationName: String,
    val types: List<ClothingTypeSummary>,
) {
    val totalCount = types.sumOf { it.totalCount }
}
