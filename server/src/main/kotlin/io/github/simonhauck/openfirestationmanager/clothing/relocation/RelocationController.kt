package io.github.simonhauck.openfirestationmanager.clothing.relocation

import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.responses.ApiResponse
import io.swagger.v3.oas.annotations.media.Content
import io.swagger.v3.oas.annotations.media.Schema
import jakarta.validation.Valid
import org.springframework.http.ProblemDetail
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.validation.annotation.Validated
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/clothing/relocation")
@Validated
class RelocationController(private val service: RelocationService) {

    @PostMapping
    @PreAuthorize("hasRole('ROLE_KLEIDERWART')")
    @Operation(summary = "Relocate clothing items to a target location")
    @ApiResponse(
        responseCode = "200",
        description = "OK",
        content = [Content(schema = Schema(implementation = RelocationResponse::class))],
    )
    @ApiResponse(
        responseCode = "400",
        description = "Bad Request",
        content = [Content(schema = Schema(implementation = ProblemDetail::class))],
    )
    @ApiResponse(
        responseCode = "403",
        description = "Forbidden — KLEIDERWART role required",
        content = [Content(schema = Schema(implementation = ProblemDetail::class))],
    )
    fun relocate(@Valid @RequestBody request: RelocationRequest): RelocationResponse =
        service.relocate(request)
}
