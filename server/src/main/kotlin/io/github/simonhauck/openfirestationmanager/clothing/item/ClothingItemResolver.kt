package io.github.simonhauck.openfirestationmanager.clothing.item

import io.github.simonhauck.openfirestationmanager.clothing.location.ClothingLocation
import io.github.simonhauck.openfirestationmanager.clothing.location.ClothingLocationRepository
import io.github.simonhauck.openfirestationmanager.clothing.type.ClothingType
import io.github.simonhauck.openfirestationmanager.clothing.type.ClothingTypeRepository
import io.github.simonhauck.openfirestationmanager.common.PublicApiException
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service

@Service
class ClothingItemResolver(
    private val itemRepository: ClothingItemRepository,
    private val typeRepository: ClothingTypeRepository,
    private val clothingLocationRepository: ClothingLocationRepository,
) {

    fun resolveOne(itemId: Long): ResolvedClothingItem {
        val item =
            itemRepository.findById(itemId)
                ?: throw PublicApiException(HttpStatus.NOT_FOUND, "Item with id $itemId not found")
        return resolve(item)
    }

    fun resolveMany(itemIds: List<Long>): List<ResolvedClothingItem> {
        val types = typeRepository.findAll().associateBy { it.id }
        val locations = clothingLocationRepository.findAll().associateBy { it.id }

        return itemIds.map { id ->
            val item =
                itemRepository.findById(id)
                    ?: throw PublicApiException(HttpStatus.NOT_FOUND, "Item with id $id not found")
            resolve(item, types, locations)
        }
    }

    private fun resolve(item: ClothingItem): ResolvedClothingItem {
        val location = item.locationId?.id?.let { clothingLocationRepository.findById(it) }
        val type =
            typeRepository.findById(item.typeId.id)
                ?: throw PublicApiException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "Type not found for item ${item.id}",
                )
        return ResolvedClothingItem(clothingItem = item, location = location, clothingType = type)
    }

    private fun resolve(
        item: ClothingItem,
        types: Map<Long, ClothingType>,
        locations: Map<Long, ClothingLocation>,
    ): ResolvedClothingItem {
        val location = item.locationId?.id?.let { locations[it] }
        val type =
            types[item.typeId.id]
                ?: throw PublicApiException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "Type not found for item ${item.id}",
                )
        return ResolvedClothingItem(clothingItem = item, location = location, clothingType = type)
    }
}
