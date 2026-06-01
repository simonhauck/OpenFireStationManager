package io.github.simonhauck.openfirestationmanager.legal.privacypolicy

import io.github.simonhauck.openfirestationmanager.common.PublicApiException
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.responses.ApiResponse
import io.swagger.v3.oas.annotations.responses.ApiResponses
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
class PrivacyPolicyPublicController(private val service: PrivacyPolicyService) {

    @GetMapping("/api/public/privacy-policy/exists")
    @Operation(summary = "Check whether a privacy policy document has been uploaded")
    @ApiResponses(ApiResponse(responseCode = "200", description = "OK"))
    fun exists(): PrivacyPolicyExists = service.exists()

    @GetMapping("/privacy-policy")
    @Operation(summary = "Serve the active privacy policy document")
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "OK"),
        ApiResponse(responseCode = "404", description = "No privacy policy document has been uploaded"),
    )
    fun serve(): ResponseEntity<ByteArray> {
        val document =
            service.getDocument()
                ?: throw PublicApiException(
                    status = HttpStatus.NOT_FOUND,
                    publicMessage = "No privacy policy document has been uploaded",
                )
        val contentType =
            if (document.charset != null) "${document.contentType}; charset=${document.charset}"
            else document.contentType
        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_TYPE, contentType)
            .header(
                HttpHeaders.CONTENT_DISPOSITION,
                "inline; filename=\"${document.fileName}\"",
            )
            .body(document.content)
    }
}
