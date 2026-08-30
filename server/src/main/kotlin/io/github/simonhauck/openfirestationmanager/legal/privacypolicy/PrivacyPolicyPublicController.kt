package io.github.simonhauck.openfirestationmanager.legal.privacypolicy

import io.github.simonhauck.openfirestationmanager.common.ApiTags
import io.github.simonhauck.openfirestationmanager.common.PublicApiException
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.media.Content
import io.swagger.v3.oas.annotations.media.Schema
import io.swagger.v3.oas.annotations.responses.ApiResponse
import io.swagger.v3.oas.annotations.responses.ApiResponses
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@Tag(name = ApiTags.LEGAL)
class PrivacyPolicyPublicController(private val service: PrivacyPolicyService) {

    @GetMapping("/api/public/privacy-policy/exists")
    @Operation(
        operationId = "publicPrivacyPolicyExists",
        summary = "Check whether a privacy policy is published",
        description =
            "Returns a boolean so a page can decide whether to show a privacy policy link " +
                "before attempting the download.",
    )
    @ApiResponses(ApiResponse(responseCode = "200", description = "Whether a document exists."))
    fun exists(): PrivacyPolicyExists = service.exists()

    @GetMapping("/privacy-policy")
    @Operation(
        operationId = "downloadPrivacyPolicy",
        summary = "Download the published privacy policy document",
        description =
            "Streams the privacy policy (`Datenschutzerklärung`) file itself. The response is " +
                "the raw document — a PDF, HTML, or plain-text body, not JSON — served with the " +
                "stored MIME type and `Content-Disposition: inline` so browsers display rather " +
                "than download it.\n\n" +
                "Note the path: this endpoint sits at the site root, **outside** the `/api` " +
                "namespace, because it is linked to directly from the website footer.",
    )
    @ApiResponses(
        ApiResponse(
            responseCode = "200",
            description = "The document contents, in the MIME type it was uploaded with.",
            content =
                [
                    Content(
                        mediaType = "application/octet-stream",
                        schema = Schema(type = "string", format = "binary"),
                    )
                ],
        ),
        ApiResponse(
            responseCode = "404",
            description = "No privacy policy document has been uploaded.",
        ),
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
            .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"${document.fileName}\"")
            .body(document.content)
    }
}
