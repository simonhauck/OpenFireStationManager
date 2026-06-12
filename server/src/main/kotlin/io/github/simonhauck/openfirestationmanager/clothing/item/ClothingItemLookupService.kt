package io.github.simonhauck.openfirestationmanager.clothing.item

import io.github.simonhauck.openfirestationmanager.clothing.location.ClothingLocationRepository
import io.github.simonhauck.openfirestationmanager.clothing.type.ClothingTypeRepository
import io.github.simonhauck.openfirestationmanager.common.NotFoundException
import org.springframework.stereotype.Service

private const val SEARCH_RESULT_CAP = 50

@Service
class ClothingItemLookupService(
    private val itemRepository: ClothingItemRepository,
    private val typeRepository: ClothingTypeRepository,
    private val locationRepository: ClothingLocationRepository,
    private val itemResolver: ClothingItemResolver,
) {

    fun findByBarcode(barcode: String, isKleiderwart: Boolean): ResolvedClothingItem {
        val item =
            itemRepository.findByBarcode(barcode)
                ?: throw NotFoundException("Item not found for barcode: $barcode")

        val resolved = itemResolver.resolveOne(item.id)

        if (
            resolved.location != null &&
            resolved.location.onlyVisibleForKleiderwart &&
            !isKleiderwart
        ) {
            throw NotFoundException("Item not found for barcode: $barcode")
        }

        return resolved
    }

    fun search(q: String, limit: Int, isKleiderwart: Boolean): List<ResolvedClothingItem> {
        val effectiveLimit = minOf(limit, SEARCH_RESULT_CAP)
        val query = q.lowercase()

        val types = typeRepository.findAll().associateBy { it.id }
        val locations = locationRepository.findAll().associateBy { it.id }

        return itemRepository
            .findAll()
            .asSequence()
            .filter { item ->
                val location = item.locationId?.id?.let { locations[it] }
                if (location != null && location.onlyVisibleForKleiderwart && !isKleiderwart)
                    return@filter false
                val typeName = types[item.typeId.id]?.name ?: ""
                typeName.lowercase().contains(query) ||
                    item.size.lowercase().contains(query) ||
                    (item.barcode?.lowercase()?.contains(query) == true)
            }
            .take(effectiveLimit)
            .map { item ->
                val location = item.locationId?.id?.let { locations[it] }
                ResolvedClothingItem(
                    clothingItem = item,
                    location = location,
                    clothingType =
                        types[item.typeId.id] ?: error("Type not found for item ${item.id}"),
                )
            }
            .toList()
    }
}
