package io.github.simonhauck.openfirestationmanager.legal.impressum

import io.github.simonhauck.openfirestationmanager.common.ApiTags
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.media.Content
import io.swagger.v3.oas.annotations.media.Schema
import io.swagger.v3.oas.annotations.responses.ApiResponse
import io.swagger.v3.oas.annotations.responses.ApiResponses
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.http.ProblemDetail
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.validation.annotation.Validated
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/admin/impressum")
@Validated
@Tag(name = ApiTags.ADMIN_LEGAL)
class ImpressumAdminController(private val service: ImpressumService) {

    @GetMapping
    @Operation(
        operationId = "getImpressum",
        summary = "Read the site notice for editing",
        description =
            "Returns the current site notice (`Impressum`). Identical in content to the public " +
                "endpoint; it exists separately so the admin UI can read it without depending on " +
                "the public route.\n\n" +
                "Call `impressumExists` first if you only need to know whether one is configured.",
    )
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "The current site notice."),
        ApiResponse(
            responseCode = "404",
            description = "No site notice has been configured yet.",
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
    fun get(): ImpressumDto = service.getDto()

    @GetMapping("/exists")
    @Operation(
        operationId = "impressumExists",
        summary = "Check whether a site notice is configured",
        description =
            "Returns a boolean without the notice itself. Use it to decide whether to call " +
                "`getImpressum`, which fails with `404` when nothing is configured.",
    )
    @ApiResponses(ApiResponse(responseCode = "200", description = "Whether a notice exists."))
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    fun exists(): ImpressumExists = service.exists()

    @PutMapping
    @Operation(
        operationId = "upsertImpressum",
        summary = "Create or replace the site notice",
        description =
            "Writes the site notice. At most one exists at a time, so this always **replaces** " +
                "any previous notice rather than adding a second — there is no create/update " +
                "distinction and no id to address.\n\n" +
                "Every field is applied as given, so send the complete notice, not just the parts " +
                "you are changing.",
    )
    @ApiResponses(ApiResponse(responseCode = "200", description = "The stored site notice."))
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    fun upsert(@Valid @RequestBody request: ImpressumDto): ImpressumDto = service.upsert(request)

    @DeleteMapping
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(
        operationId = "deleteImpressum",
        summary = "Remove the site notice",
        description =
            "Deletes the site notice, after which the public endpoint reports it as absent. " +
                "Succeeds even when no notice is configured, so it is safe to call blindly.",
    )
    @ApiResponses(ApiResponse(responseCode = "204", description = "No notice is configured now."))
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    fun delete() {
        service.delete()
    }
}
