package io.github.simonhauck.openfirestationmanager.legal.impressum

import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.responses.ApiResponse
import io.swagger.v3.oas.annotations.responses.ApiResponses
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/public/impressum")
class ImpressumPublicController(private val service: ImpressumService) {

    @GetMapping
    @Operation(summary = "Get the current Impressum")
    @ApiResponses(ApiResponse(responseCode = "200", description = "OK"))
    fun get(): ImpressumDto? = service.getDto()

    @GetMapping("/exists")
    @Operation(summary = "Check whether an Impressum has been configured")
    @ApiResponses(ApiResponse(responseCode = "200", description = "OK"))
    fun exists(): ImpressumExists = service.exists()
}
