package io.github.simonhauck.openfirestationmanager.clothing.checkout

import com.fasterxml.jackson.annotation.JsonSubTypes
import com.fasterxml.jackson.annotation.JsonTypeInfo

@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, include = JsonTypeInfo.As.PROPERTY, property = "status")
@JsonSubTypes(
    JsonSubTypes.Type(value = CheckoutHttpResponse.Ok::class, name = "ok"),
    JsonSubTypes.Type(
        value = CheckoutHttpResponse.NeedsConfirmation::class,
        name = "needs_confirmation",
    ),
)
sealed class CheckoutHttpResponse {
    data class Ok(val batchId: String) : CheckoutHttpResponse()

    data class NeedsConfirmation(val discrepancies: List<Discrepancy>) : CheckoutHttpResponse()
}

fun CheckoutResponse.toHttpResponse(): CheckoutHttpResponse =
    when (this) {
        is CheckoutResponse.Ok -> CheckoutHttpResponse.Ok(batchId)
        is CheckoutResponse.NeedsConfirmation ->
            CheckoutHttpResponse.NeedsConfirmation(discrepancies)
    }
