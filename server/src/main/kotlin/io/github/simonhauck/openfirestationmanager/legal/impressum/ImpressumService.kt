package io.github.simonhauck.openfirestationmanager.legal.impressum

import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class ImpressumService(private val repository: ImpressumRepository) {

    @Transactional
    fun upsert(request: ImpressumDto): ImpressumDto {
        repository.deleteAll()
        val impressum =
            Impressum(
                name = request.name,
                address = request.address,
                contactEmail = request.contactEmail,
                phone = request.phone,
            )
        return repository.save(impressum).toDto()
    }

    fun delete() = repository.deleteAll()

    fun find(): Impressum? = repository.findAll().firstOrNull()

    fun getDto(): ImpressumDto? = find()?.toDto()

    fun exists(): ImpressumExists = ImpressumExists(find() != null)
}
