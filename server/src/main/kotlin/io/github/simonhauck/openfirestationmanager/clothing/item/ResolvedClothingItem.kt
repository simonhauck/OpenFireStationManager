package io.github.simonhauck.openfirestationmanager.clothing.item

import io.github.simonhauck.openfirestationmanager.clothing.location.ClothingLocation
import io.github.simonhauck.openfirestationmanager.clothing.type.ClothingType
import io.swagger.v3.oas.annotations.media.Schema

@Schema(
    description =
        "A clothing item with its type and current location embedded in full, so no follow-up " +
            "lookups are needed to display it."
)
data class ResolvedClothingItem(
    @field:Schema(description = "The garment itself.") val clothingItem: ClothingItem,
    @field:Schema(
        description =
            "Where the garment currently is. Null when the item is not assigned to any location."
    )
    val location: ClothingLocation?,
    @field:Schema(description = "The type (`Kleidungsart`) this garment belongs to.")
    val clothingType: ClothingType,
)
