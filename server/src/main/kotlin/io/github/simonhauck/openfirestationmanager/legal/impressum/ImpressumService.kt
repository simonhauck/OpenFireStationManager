package io.github.simonhauck.openfirestationmanager.legal.impressum

import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class ImpressumService(private val repository: ImpressumRepository) {

    @Transactional
    fun upsert(request: ImpressumRequest): ImpressumResponse {
        repository.deleteAll()
        val impressum =
            Impressum(
                name = request.name,
                address = request.address,
                contactEmail = request.contactEmail,
                phone = request.phone,
            )
        return repository.save(impressum).toResponse()
    }

    fun delete() = repository.deleteAll()

    fun find(): Impressum? = repository.findAll().firstOrNull()

    fun getResponse(): ImpressumResponse? = find()?.toResponse()

    fun exists(): ImpressumExists = ImpressumExists(find() != null)
}
