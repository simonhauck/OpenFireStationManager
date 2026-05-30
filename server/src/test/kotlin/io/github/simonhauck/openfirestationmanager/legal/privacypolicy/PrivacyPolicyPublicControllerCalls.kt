package io.github.simonhauck.openfirestationmanager.legal.privacypolicy

import org.springframework.boot.resttestclient.TestRestTemplate
import org.springframework.boot.resttestclient.getForEntity
import org.springframework.http.ResponseEntity
import org.springframework.stereotype.Component

@Component
class PrivacyPolicyPublicControllerCalls(private val testRestTemplate: TestRestTemplate) {

    fun getPrivacyPolicy(): ResponseEntity<ByteArray> {
        return testRestTemplate.getForEntity<ByteArray>("/privacy-policy")
    }
}
