package io.github.simonhauck.openfirestationmanager.clothing.checkout

import io.swagger.v3.oas.annotations.Operation
import jakarta.validation.Valid
import org.springframework.security.core.Authentication
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/clothing/checkouts")
class CheckoutController(private val checkoutService: CheckoutService) {

    @PostMapping
    @Operation(summary = "Perform a two-phase checkout")
    fun checkout(
        @Valid @RequestBody request: CheckoutRequest,
        authentication: Authentication,
    ): CheckoutHttpResponse {
        val isKleiderwart = authentication.authorities.any { it.authority == "ROLE_KLEIDERWART" }
        return checkoutService.checkout(request, isKleiderwart).toHttpResponse()
    }
}
