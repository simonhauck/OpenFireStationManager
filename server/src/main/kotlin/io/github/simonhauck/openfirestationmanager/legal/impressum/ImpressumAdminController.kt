package io.github.simonhauck.openfirestationmanager.legal.impressum

import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.media.Content
import io.swagger.v3.oas.annotations.media.Schema
import io.swagger.v3.oas.annotations.responses.ApiResponse
import io.swagger.v3.oas.annotations.responses.ApiResponses
import org.springframework.http.HttpStatus
import org.springframework.http.ProblemDetail
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/admin/impressum")
class ImpressumAdminController(private val service: ImpressumService) {

    @GetMapping
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    @Operation(summary = "Get the current Impressum")
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "OK"),
        ApiResponse(
            responseCode = "404",
            description = "No Impressum has been configured",
            content = [Content(schema = Schema(implementation = ProblemDetail::class))],
        ),
    )
    fun get(): ImpressumResponse? = service.getResponse()

    @GetMapping("/exists")
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    @Operation(summary = "Check whether an Impressum has been configured")
    @ApiResponses(ApiResponse(responseCode = "200", description = "OK"))
    fun exists(): ImpressumExists = service.exists()

    @PutMapping
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    @Operation(summary = "Create or update the Impressum")
    @ApiResponses(ApiResponse(responseCode = "200", description = "OK"))
    fun upsert(@RequestBody request: ImpressumRequest): ImpressumResponse = service.upsert(request)

    @DeleteMapping
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    @Operation(summary = "Delete the Impressum")
    fun delete() {
        service.delete()
    }
}
