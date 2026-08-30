package io.github.simonhauck.openfirestationmanager.clothing.inventoryreconciliation

import io.github.simonhauck.openfirestationmanager.clothing.item.ResolvedClothingItem
import io.swagger.v3.oas.annotations.media.Schema

@Schema(description = "The set of garments physically found at a location during a stock-take.")
data class InventoryReconciliationPreviewRequest(
    @field:Schema(
        description =
            "Ids of every garment actually seen at the location, typically collected by scanning " +
                "barcodes. Send the complete set: anything currently recorded at the location " +
                "but absent from this list is treated as missing. Duplicates are ignored.",
        example = "[41, 42, 43]",
    )
    val scannedItemIds: List<Long>
)

@Schema(
    description =
        """
        The difference between what was scanned and what the system believed, split three ways.

        This is both the output of the preview step and the input to the execute step. Passing it
        back unchanged applies exactly what the preview described. You may also **edit it first** —
        removing an entry from `missingItems` leaves that garment recorded at the location instead
        of unassigning it, which is how a user resolves "I know it's here, I just didn't scan it".
        """
)
data class InventoryReconciliationPreviewResponse(
    @field:Schema(
        description =
            "Scanned garments that the system already recorded at this location. Executing does " +
                "nothing to these beyond counting them."
    )
    val unchangedItems: List<ResolvedClothingItem>,
    @field:Schema(
        description =
            "Scanned garments the system believed were somewhere else. Executing moves each of " +
                "them to this location."
    )
    val foundItems: List<ResolvedClothingItem>,
    @field:Schema(
        description =
            "Garments the system records at this location but which were not scanned. Executing " +
                "clears their location entirely, leaving them unassigned rather than moving them " +
                "somewhere else."
    )
    val missingItems: List<ResolvedClothingItem>,
)

@Schema(description = "Summary of what an executed reconciliation changed.")
data class InventoryReconciliationExecuteResponse(
    @field:Schema(
        description =
            "Identifier shared by every movement this reconciliation produced, for tracing the " +
                "stock-take as one unit.",
        example = "3f2b1c9e-5d47-4a1b-9f8e-2c6d0a7b4e13",
    )
    val batchId: String,
    @field:Schema(description = "How many garments were moved into this location.", example = "2")
    val foundItemsCount: Int,
    @field:Schema(description = "How many garments were left unassigned.", example = "1")
    val missingItemsCount: Int,
    @field:Schema(
        description = "How many garments were already recorded correctly and were left alone.",
        example = "17",
    )
    val unchangedItemsCount: Int,
)
