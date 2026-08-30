package io.github.simonhauck.openfirestationmanager.clothing.checkout

import io.github.simonhauck.openfirestationmanager.common.ApiTags
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.media.Content
import io.swagger.v3.oas.annotations.media.Schema
import io.swagger.v3.oas.annotations.responses.ApiResponse
import io.swagger.v3.oas.annotations.responses.ApiResponses
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.springframework.http.ProblemDetail
import org.springframework.validation.annotation.Validated
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/clothing/checkouts")
@Validated
@Tag(name = ApiTags.CLOTHING_CHECKOUT)
class CheckoutController(private val checkoutService: CheckoutService) {

    @PostMapping
    @Operation(
        operationId = "checkoutClothingItems",
        summary = "Take garments out, hand garments back, or both at once",
        description =
            "Records a member taking protective clothing out of stock and/or returning it. This " +
                "is the everyday operation of the clothing domain, and the correct way to move " +
                "garments in normal use — it updates each item's location *and* writes an " +
                "auditable movement entry, which editing an item directly does not.\n\n" +
                "A single request can do both halves of a swap. Items listed in `takeItemIds` " +
                "move to `targetLocationId`, which must be a `PERSONAL` location. Items listed " +
                "in `returnItemIds` move to `returnLocationId`, which must be a `WAESCHE` or " +
                "`POOL` location. Sending a location of the wrong type is rejected with `400`.\n\n" +
                "The entire request is applied in one transaction, so a failure part-way through " +
                "leaves nothing changed. The returned `batchId` tags every movement the request " +
                "produced, making the transaction traceable as a unit.\n\n" +
                "Note that garments are not validated against who is checking them out: any " +
                "signed-in user may check any item out to any `PERSONAL` location.",
    )
    @ApiResponses(
        ApiResponse(
            responseCode = "200",
            description = "The checkout was applied. The body carries the batch id.",
        ),
        ApiResponse(
            responseCode = "400",
            description =
                "The request broke a checkout rule — both item lists empty, a missing location " +
                    "id, the same item in both lists, a location of the wrong type, or a " +
                    "`KLEIDERWART`-only location used by a caller without that role.",
            content =
                [
                    Content(
                        mediaType = "application/problem+json",
                        schema = Schema(implementation = ProblemDetail::class),
                    )
                ],
        ),
        ApiResponse(
            responseCode = "404",
            description = "One of the referenced clothing items or locations does not exist.",
            content =
                [
                    Content(
                        mediaType = "application/problem+json",
                        schema = Schema(implementation = ProblemDetail::class),
                    )
                ],
        ),
    )
    fun checkout(@Valid @RequestBody request: CheckoutRequest): CheckoutResponse {
        return checkoutService.checkout(request)
    }
}
