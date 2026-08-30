package io.github.simonhauck.openfirestationmanager.legal.privacypolicy

import io.github.simonhauck.openfirestationmanager.common.ApiTags
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.Parameter
import io.swagger.v3.oas.annotations.media.Content
import io.swagger.v3.oas.annotations.media.Schema
import io.swagger.v3.oas.annotations.responses.ApiResponse
import io.swagger.v3.oas.annotations.responses.ApiResponses
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
import org.springframework.http.ProblemDetail
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController
import org.springframework.web.multipart.MultipartFile

@RestController
@RequestMapping("/api/admin/privacy-policy")
@Tag(name = ApiTags.ADMIN_LEGAL)
class PrivacyPolicyAdminController(private val service: PrivacyPolicyService) {

    @GetMapping
    @Operation(
        operationId = "getPrivacyPolicyMetadata",
        summary = "Describe the stored privacy policy document",
        description =
            "Returns the file name, MIME type, size, and upload time of the stored privacy " +
                "policy (`Datenschutzerklärung`) — but not the file itself. Download the " +
                "contents from `GET /privacy-policy`, which is public.",
    )
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Details of the stored document."),
        ApiResponse(
            responseCode = "404",
            description = "No privacy policy document has been uploaded.",
            content =
                [
                    Content(
                        mediaType = "application/problem+json",
                        schema = Schema(implementation = ProblemDetail::class),
                    )
                ],
        ),
    )
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    fun getMetadata(): PrivacyPolicyMetadata = service.getMetadata()

    @GetMapping("/exists")
    @Operation(
        operationId = "privacyPolicyExists",
        summary = "Check whether a privacy policy document is stored",
        description =
            "Returns a boolean without the document or its details. Use it to decide whether to " +
                "call `getPrivacyPolicyMetadata`, which fails with `404` when nothing is stored.",
    )
    @ApiResponses(ApiResponse(responseCode = "200", description = "Whether a document exists."))
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    fun exists(): PrivacyPolicyExists = service.exists()

    @PostMapping(consumes = [MediaType.MULTIPART_FORM_DATA_VALUE])
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(
        operationId = "uploadPrivacyPolicy",
        summary = "Upload the privacy policy document",
        description =
            "Stores a privacy policy file as `multipart/form-data`. At most one document exists " +
                "at a time, so uploading always **replaces** the previous one.\n\n" +
                "Only `application/pdf`, `text/html`, and `text/plain` are accepted; anything " +
                "else is rejected with `422`. Files are capped at 10 MB by the server's multipart " +
                "limits, and an oversized upload fails before this endpoint is reached.\n\n" +
                "This is the one place in the API that answers `201 Created` rather than `200`.",
    )
    @ApiResponses(
        ApiResponse(responseCode = "201", description = "Details of the newly stored document."),
        ApiResponse(
            responseCode = "422",
            description =
                "The file's MIME type is not one of the three accepted types. Nothing was stored " +
                    "and any previous document is untouched.",
            content =
                [
                    Content(
                        mediaType = "application/problem+json",
                        schema = Schema(implementation = ProblemDetail::class),
                    )
                ],
        ),
    )
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    fun upload(
        @Parameter(
            description =
                "The document to store. Must be a PDF, HTML, or plain-text file of at most 10 MB."
        )
        @RequestParam("file")
        file: MultipartFile
    ): PrivacyPolicyMetadata = service.upload(file)

    @DeleteMapping
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(
        operationId = "deletePrivacyPolicy",
        summary = "Remove the stored privacy policy document",
        description =
            "Deletes the document, after which the public download returns `404`. Succeeds even " +
                "when nothing is stored, so it is safe to call blindly.",
    )
    @ApiResponses(ApiResponse(responseCode = "204", description = "No document is stored now."))
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    fun delete() {
        service.delete()
    }
}
