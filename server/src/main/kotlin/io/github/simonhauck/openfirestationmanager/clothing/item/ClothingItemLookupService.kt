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
) {

    fun findByBarcode(barcode: String, isKleiderwart: Boolean): ResolvedClothingItem {
        val item =
            itemRepository.findByBarcode(barcode)
                ?: throw NotFoundException("Item not found for barcode: $barcode")

        val location = item.locationId?.id?.let { locationRepository.findById(it) }

        if (location != null && location.onlyVisibleForKleiderwart && !isKleiderwart) {
            throw NotFoundException("Item not found for barcode: $barcode")
        }

        val type =
            typeRepository.findById(item.typeId.id!!)
                ?: throw NotFoundException("Type not found for item ${item.id}")

        return ResolvedClothingItem(
            id = item.id,
            barcode = item.barcode,
            typeName = type.name,
            size = item.size,
            currentLocationId = location?.id,
            currentLocationName = location?.name,
            currentLocationType = location?.type,
        )
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
                val typeName = types[item.typeId.id]?.name ?: ""
                ResolvedClothingItem(
                    id = item.id,
                    barcode = item.barcode,
                    typeName = typeName,
                    size = item.size,
                    currentLocationId = location?.id,
                    currentLocationName = location?.name,
                    currentLocationType = location?.type,
                )
            }
            .toList()
    }
}
