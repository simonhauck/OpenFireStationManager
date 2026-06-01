package io.github.simonhauck.openfirestationmanager.legal.impressum

import org.springframework.data.repository.Repository

interface ImpressumRepository : Repository<Impressum, Long> {

    fun save(impressum: Impressum): Impressum

    fun findAll(): List<Impressum>

    fun deleteAll()
}
