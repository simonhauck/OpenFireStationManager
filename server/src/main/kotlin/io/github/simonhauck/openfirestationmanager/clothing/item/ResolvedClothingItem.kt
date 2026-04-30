package io.github.simonhauck.openfirestationmanager.clothing.item

import io.github.simonhauck.openfirestationmanager.clothing.location.LocationType

data class ResolvedClothingItem(
    val id: Long,
    val barcode: String?,
    val typeName: String,
    val size: String,
    val currentLocationId: Long?,
    val currentLocationName: String?,
    val currentLocationType: LocationType?,
)
