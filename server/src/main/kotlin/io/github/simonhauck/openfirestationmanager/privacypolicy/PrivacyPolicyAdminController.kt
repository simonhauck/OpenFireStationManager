package io.github.simonhauck.openfirestationmanager.privacypolicy

import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.media.Content
import io.swagger.v3.oas.annotations.media.Schema
import io.swagger.v3.oas.annotations.responses.ApiResponse
import io.swagger.v3.oas.annotations.responses.ApiResponses
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
class PrivacyPolicyAdminController(private val service: PrivacyPolicyService) {

    @GetMapping
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    @Operation(summary = "Get metadata of the active privacy policy document")
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "OK"),
        ApiResponse(
            responseCode = "404",
            description = "No privacy policy document has been uploaded",
            content = [Content(schema = Schema(implementation = ProblemDetail::class))],
        ),
    )
    fun getMetadata(): PrivacyPolicyMetadata = service.getMetadata()

    @PostMapping(consumes = [MediaType.MULTIPART_FORM_DATA_VALUE])
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    @Operation(summary = "Upload a new privacy policy document, replacing any existing one")
    @ApiResponses(
        ApiResponse(responseCode = "201", description = "Created"),
        ApiResponse(
            responseCode = "422",
            description = "Unsupported file type or file too large",
            content = [Content(schema = Schema(implementation = ProblemDetail::class))],
        ),
    )
    fun upload(@RequestParam("file") file: MultipartFile): PrivacyPolicyMetadata =
        service.upload(file)

    @DeleteMapping
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    @Operation(summary = "Delete the active privacy policy document")
    fun delete() {
        service.delete()
    }
}
