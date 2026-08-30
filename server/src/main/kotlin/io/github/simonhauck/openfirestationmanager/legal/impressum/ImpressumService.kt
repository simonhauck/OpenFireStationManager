package io.github.simonhauck.openfirestationmanager.legal.impressum

import io.github.simonhauck.openfirestationmanager.common.PublicApiException
import org.springframework.http.HttpStatus
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

    /**
     * Returns the site notice, or fails with `404` when none is configured.
     *
     * Mirrors `PrivacyPolicyService.getMetadata`: absence is reported as a status rather than as a
     * `200` carrying an empty body, so the documented response schema is never nullable. Use
     * [exists] to probe without provoking an error.
     */
    fun getDto(): ImpressumDto =
        find()?.toDto()
            ?: throw PublicApiException(
                status = HttpStatus.NOT_FOUND,
                publicMessage = "No Impressum has been configured",
            )

    fun exists(): ImpressumExists = ImpressumExists(find() != null)
}
