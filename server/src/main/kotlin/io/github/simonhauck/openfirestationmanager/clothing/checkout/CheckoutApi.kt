package io.github.simonhauck.openfirestationmanager.clothing.checkout

data class CheckoutRequest(
    val targetLocationId: Long,
    val returnLocationId: Long? = null,
    val takeItemIds: List<Long> = emptyList(),
    val returnItemIds: List<Long> = emptyList(),
)

data class CheckoutResponse(val batchId: String)
