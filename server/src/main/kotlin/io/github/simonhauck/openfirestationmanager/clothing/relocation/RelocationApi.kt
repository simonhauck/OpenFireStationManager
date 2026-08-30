package io.github.simonhauck.openfirestationmanager.clothing.relocation

import io.swagger.v3.oas.annotations.media.Schema
import jakarta.validation.constraints.NotEmpty

@Schema(
    description =
        "A bulk move of garments into one destination, regardless of where each of them is now."
)
data class RelocationRequest(
    @field:Schema(
        description =
            "Id of the location every listed garment is moved into. Any location type is " +
                "accepted — unlike checkout, relocation places no restriction on the destination.",
        example = "7",
    )
    val targetLocationId: Long,
    @field:Schema(
        description =
            "Ids of the garments to move. Must contain at least one entry. If any id is unknown " +
                "the whole request fails and nothing is moved.",
        example = "[41, 42, 43]",
    )
    @field:NotEmpty
    val itemIds: List<Long>,
)
