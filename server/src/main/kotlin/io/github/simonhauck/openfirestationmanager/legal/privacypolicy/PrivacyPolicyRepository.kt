package io.github.simonhauck.openfirestationmanager.legal.privacypolicy

import org.springframework.data.repository.Repository

interface PrivacyPolicyRepository : Repository<PrivacyPolicyDocument, Long> {

    fun save(document: PrivacyPolicyDocument): PrivacyPolicyDocument

    fun findAll(): List<PrivacyPolicyDocument>

    fun deleteAll()
}
