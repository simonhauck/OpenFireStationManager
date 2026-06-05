package io.github.simonhauck.openfirestationmanager.clothing.checkout

import jakarta.validation.Constraint
import jakarta.validation.Payload
import kotlin.reflect.KClass

@Target(AnnotationTarget.CLASS)
@Retention(AnnotationRetention.RUNTIME)
@Constraint(validatedBy = [CheckoutRequestValidator::class])
annotation class ValidCheckout(
    val message: String = "Invalid checkout request",
    val groups: Array<KClass<*>> = [],
    val payload: Array<KClass<out Payload>> = [],
)
