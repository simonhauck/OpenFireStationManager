package io.github.simonhauck.openfirestationmanager.clothing.inventoryreconciliation

import io.github.simonhauck.openfirestationmanager.clothing.item.ResolvedClothingItem

data class InventoryReconciliationPreviewRequest(val scannedItemIds: List<Long>)

data class InventoryReconciliationPreviewResponse(
    val unchangedItems: List<ResolvedClothingItem>,
    val foundItems: List<ResolvedClothingItem>,
    val missingItems: List<ResolvedClothingItem>,
)

data class InventoryReconciliationExecuteResponse(
    val batchId: String,
    val foundItemsCount: Int,
    val missingItemsCount: Int,
    val unchangedItemsCount: Int,
)
