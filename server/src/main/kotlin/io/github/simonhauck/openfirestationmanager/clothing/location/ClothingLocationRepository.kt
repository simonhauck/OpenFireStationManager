package io.github.simonhauck.openfirestationmanager.clothing.location

import org.springframework.data.repository.Repository

interface ClothingLocationRepository : Repository<ClothingLocation, Long> {

    fun save(clothingLocation: ClothingLocation): ClothingLocation

    fun saveAll(clothingLocations: Iterable<ClothingLocation>): List<ClothingLocation>

    fun findAll(): List<ClothingLocation>

    fun findById(id: Long): ClothingLocation?

    fun deleteById(id: Long)
}
