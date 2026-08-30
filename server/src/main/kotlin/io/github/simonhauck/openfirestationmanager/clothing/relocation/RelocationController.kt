package io.github.simonhauck.openfirestationmanager.clothing.relocation

import io.github.simonhauck.openfirestationmanager.clothing.item.ClothingItem
import io.github.simonhauck.openfirestationmanager.common.ApiTags
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.media.Content
import io.swagger.v3.oas.annotations.media.Schema
import io.swagger.v3.oas.annotations.responses.ApiResponse
import io.swagger.v3.oas.annotations.responses.ApiResponses
import io.swagger.v3.oas.annotations.tags.Tag
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
@Tag(name = ApiTags.CLOTHING_RELOCATION)
class RelocationController(private val service: RelocationService) {

    @PostMapping
    @Operation(
        operationId = "relocateClothingItems",
        summary = "Move a set of garments into one location",
        description =
            "Bulk-moves garments (`Umlagerung`) into a single destination, whatever their " +
                "current locations are. This is stock management rather than everyday use: " +
                "emptying a laundry batch back into the pool, or clearing out a locker.\n\n" +
                "Unlike `checkoutClothingItems`, the destination may be **any** location type, " +
                "and no rule ties the move to a particular member. Every move is logged with " +
                "reason `RELOCATION`, and all of them share one batch id.\n\n" +
                "The whole request runs in one transaction: if any item or the destination is " +
                "unknown, nothing is moved. The response echoes the items in their updated state.",
    )
    @ApiResponses(
        ApiResponse(
            responseCode = "200",
            description = "The garments were moved. The body carries them in their updated state.",
        ),
        ApiResponse(
            responseCode = "404",
            description = "The destination location, or one of the listed items, does not exist.",
            content =
                [
                    Content(
                        mediaType = "application/problem+json",
                        schema = Schema(implementation = ProblemDetail::class),
                    )
                ],
        ),
    )
    @PreAuthorize("hasRole('ROLE_KLEIDERWART')")
    fun relocate(@Valid @RequestBody request: RelocationRequest): List<ClothingItem> =
        service.relocate(request)
}
