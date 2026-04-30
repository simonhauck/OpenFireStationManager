package io.github.simonhauck.openfirestationmanager.clothing.checkout

data class CheckoutRequest(
    val targetLocationId: Long,
    val returnLocationId: Long? = null,
    val takeItemIds: List<Long> = emptyList(),
    val returnItemIds: List<Long> = emptyList(),
    val acknowledgedItemIds: List<Long> = emptyList(),
)

sealed class CheckoutResponse {
    data class Ok(val batchId: String) : CheckoutResponse()

    data class NeedsConfirmation(val discrepancies: List<Discrepancy>) : CheckoutResponse()
}

data class Discrepancy(val itemId: Long, val claimedLocationId: Long, val actualLocationId: Long?)
