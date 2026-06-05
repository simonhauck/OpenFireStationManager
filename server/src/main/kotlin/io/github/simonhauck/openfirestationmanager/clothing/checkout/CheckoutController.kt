package io.github.simonhauck.openfirestationmanager.clothing.checkout

import io.swagger.v3.oas.annotations.Operation
import jakarta.validation.Valid
import org.springframework.validation.annotation.Validated
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/clothing/checkouts")
@Validated
class CheckoutController(private val checkoutService: CheckoutService) {

    @PostMapping
    @Operation(
        summary = "Perform a checkout",
        description = "Perform checkout and returns for clothing items",
    )
    fun checkout(@Valid @RequestBody request: CheckoutRequest): CheckoutResponse {
        return checkoutService.checkout(request)
    }
}
