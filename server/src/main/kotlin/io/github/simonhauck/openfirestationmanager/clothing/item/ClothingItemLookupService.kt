package io.github.simonhauck.openfirestationmanager.clothing.item

import io.github.simonhauck.openfirestationmanager.common.NotFoundException
import org.springframework.stereotype.Service

private const val SEARCH_RESULT_CAP = 50

@Service
class ClothingItemLookupService(private val itemResolver: ClothingItemResolver) {

    fun findByBarcode(barcode: String, isKleiderwart: Boolean): ResolvedClothingItem {
        val resolved =
            itemResolver.resolveByBarcode(barcode)
                ?: throw NotFoundException("Item not found for barcode: $barcode")

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

        return itemResolver
            .resolveAll()
            .asSequence()
            .filter { resolved ->
                val location = resolved.location
                if (location != null && location.onlyVisibleForKleiderwart && !isKleiderwart)
                    return@filter false
                val typeName = resolved.clothingType.name.lowercase()
                typeName.contains(query) ||
                    resolved.clothingItem.size.lowercase().contains(query) ||
                    (resolved.clothingItem.barcode?.lowercase()?.contains(query) == true)
            }
            .take(effectiveLimit)
            .toList()
    }
}
