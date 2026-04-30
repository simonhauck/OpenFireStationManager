package io.github.simonhauck.openfirestationmanager.clothing.item

import io.github.simonhauck.openfirestationmanager.clothing.location.ClothingLocation
import io.github.simonhauck.openfirestationmanager.clothing.type.ClothingType

data class ResolvedClothingItem(
    val clothingItem: ClothingItem,
    val location: ClothingLocation?,
    val clothingType: ClothingType,
)
