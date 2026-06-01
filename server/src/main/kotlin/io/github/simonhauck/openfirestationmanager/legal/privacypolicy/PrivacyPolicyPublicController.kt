package io.github.simonhauck.openfirestationmanager.legal.privacypolicy

import io.github.simonhauck.openfirestationmanager.common.NotFoundException
import java.nio.charset.Charset
import org.springframework.http.ContentDisposition
import org.springframework.http.HttpHeaders
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RestController

@RestController
class PrivacyPolicyPublicController(private val service: PrivacyPolicyService) {

    @GetMapping("/privacy-policy")
    fun getPrivacyPolicy(): ResponseEntity<ByteArray> {
        val document =
            service.getDocument()
                ?: throw NotFoundException("No privacy policy document has been uploaded")

        val contentDisposition =
            ContentDisposition.inline().filename(document.fileName).build().toString()

        val mediaType =
            MediaType.parseMediaType(document.contentType).let { base ->
                val charset = document.charset?.let { Charset.forName(it) }
                if (charset != null) MediaType(base, charset) else base
            }

        return ResponseEntity.ok()
            .contentType(mediaType)
            .header(HttpHeaders.CONTENT_DISPOSITION, contentDisposition)
            .body(document.content)
    }
}
