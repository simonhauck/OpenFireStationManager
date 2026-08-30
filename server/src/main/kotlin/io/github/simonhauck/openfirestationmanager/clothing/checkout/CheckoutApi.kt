package io.github.simonhauck.openfirestationmanager.clothing.checkout

import io.swagger.v3.oas.annotations.media.Schema

@Schema(
    description =
        """
        A single checkout transaction. One request may take garments out, return garments, or do
        both at once — a member swapping a dirty jacket for a clean one is one request, not two.

        The rules enforced across the whole request are:

        - At least one of `takeItemIds` and `returnItemIds` must be non-empty.
        - `targetLocationId` is required whenever `takeItemIds` is non-empty.
        - `returnLocationId` is required whenever `returnItemIds` is non-empty.
        - The same item id may not appear in both lists.

        Breaking any of these yields `400`, with the offending rule named in the `errors` array.
        """
)
@ValidCheckout
data class CheckoutRequest(
    @field:Schema(
        description =
            "Where the taken garments end up. Must be a location of type `PERSONAL` — you check " +
                "items out *to* a member's own storage, never to the shared pool. Required if " +
                "`takeItemIds` is non-empty; ignored otherwise.",
        example = "12",
    )
    val targetLocationId: Long?,
    @field:Schema(
        description =
            "Where the returned garments are put. Must be a location of type `WAESCHE` (going to " +
                "the laundry) or `POOL` (going straight back into shared stock). Required if " +
                "`returnItemIds` is non-empty; ignored otherwise.",
        example = "3",
    )
    val returnLocationId: Long? = null,
    @field:Schema(
        description =
            "Ids of the garments being taken out. Each is moved to `targetLocationId` and logged " +
                "with reason `CHECKOUT`.",
        example = "[41, 42]",
    )
    val takeItemIds: List<Long> = emptyList(),
    @field:Schema(
        description =
            "Ids of the garments being handed back. Each is moved to `returnLocationId` and " +
                "logged with reason `RETURN`.",
        example = "[17]",
    )
    val returnItemIds: List<Long> = emptyList(),
)

@Schema(description = "Confirmation that a checkout was applied.")
data class CheckoutResponse(
    @field:Schema(
        description =
            "Identifier shared by every movement this request produced. Use it to group or trace " +
                "the whole transaction in the movement log.",
        example = "3f2b1c9e-5d47-4a1b-9f8e-2c6d0a7b4e13",
    )
    val batchId: String
)
