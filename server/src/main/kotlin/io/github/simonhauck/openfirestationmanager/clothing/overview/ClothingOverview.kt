package io.github.simonhauck.openfirestationmanager.clothing.overview

import io.swagger.v3.oas.annotations.media.Schema

@Schema(description = "How many garments exist in one specific size.")
data class SizeSummary(
    @field:Schema(description = "The size label.", example = "52") val size: String,
    @field:Schema(description = "Number of garments in this size.", example = "4") val count: Int,
)

@Schema(
    description =
        "A band of related sizes, so that a long list of individual sizes stays readable. " +
            "Numeric sizes are grouped under `#`, and anything unrecognised under `Sonstige`."
)
data class SizeGroupSummary(
    @field:Schema(description = "Name of the size band, e.g. `M`, `XL`, `#`.", example = "XL")
    val name: String,
    @field:Schema(description = "The individual sizes making up this band.")
    val sizes: List<SizeSummary>,
) {
    @get:Schema(description = "Total garments across every size in this band.", example = "9")
    val totalCount = sizes.sumOf { it.count }
}

@Schema(description = "Stock of one clothing type, broken down by size band.")
data class ClothingTypeSummary(
    @field:Schema(description = "Id of the clothing type.", example = "3") val typeId: Long,
    @field:Schema(description = "Name of the clothing type.", example = "Einsatzjacke")
    val typeName: String,
    @field:Schema(description = "Stock grouped into size bands.")
    val sizeGroupSummary: List<SizeGroupSummary>,
) {
    @get:Schema(description = "Total garments of this type.", example = "37")
    val totalCount = sizeGroupSummary.sumOf { it.totalCount }
}

@Schema(description = "Stock held at one location, broken down by clothing type and size.")
data class ClothingLocationSummary(
    @field:Schema(description = "Id of the location.", example = "7") val locationId: Long,
    @field:Schema(description = "Name of the location.", example = "Lager Regal B")
    val locationName: String,
    @field:Schema(description = "Stock at this location, grouped by clothing type.")
    val types: List<ClothingTypeSummary>,
) {
    @get:Schema(description = "Total garments held at this location.", example = "112")
    val totalCount = types.sumOf { it.totalCount }
}
