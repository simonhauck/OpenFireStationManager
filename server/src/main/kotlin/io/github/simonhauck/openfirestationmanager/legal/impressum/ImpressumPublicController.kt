package io.github.simonhauck.openfirestationmanager.legal.impressum

import io.github.simonhauck.openfirestationmanager.common.ApiTags
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.media.Content
import io.swagger.v3.oas.annotations.media.Schema
import io.swagger.v3.oas.annotations.responses.ApiResponse
import io.swagger.v3.oas.annotations.responses.ApiResponses
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.http.ProblemDetail
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/public/impressum")
@Tag(name = ApiTags.LEGAL)
class ImpressumPublicController(private val service: ImpressumService) {

    @GetMapping
    @Operation(
        operationId = "getPublicImpressum",
        summary = "Read the publicly published site notice",
        description =
            "Returns the station's site notice (`Impressum`) — the operator details German law " +
                "requires a public website to display. No session is needed.",
    )
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "The published site notice."),
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
    fun get(): ImpressumDto = service.getDto()

    @GetMapping("/exists")
    @Operation(
        operationId = "publicImpressumExists",
        summary = "Check whether a site notice is published",
        description =
            "Returns a boolean without the notice itself, so a page can decide whether to show " +
                "an Impressum link before fetching it.",
    )
    @ApiResponses(ApiResponse(responseCode = "200", description = "Whether a notice exists."))
    fun exists(): ImpressumExists = service.exists()
}
