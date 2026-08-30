package io.github.simonhauck.openfirestationmanager.clothing.checkout

import jakarta.validation.ConstraintValidator
import jakarta.validation.ConstraintValidatorContext
import org.springframework.stereotype.Component

@Component
class CheckoutRequestValidator : ConstraintValidator<ValidCheckout, CheckoutRequest> {

    override fun isValid(request: CheckoutRequest, context: ConstraintValidatorContext): Boolean {
        context.disableDefaultConstraintViolation()

        if (request.takeItemIds.isEmpty() && request.returnItemIds.isEmpty()) {
            context
                .buildConstraintViolationWithTemplate(
                    "takeItemIds and returnItemIds cannot both be empty"
                )
                .addConstraintViolation()
            return false
        }

        if (request.returnItemIds.isNotEmpty() && request.returnLocationId == null) {
            context
                .buildConstraintViolationWithTemplate(
                    "returnLocationId must be provided if returnItemIds is not empty"
                )
                .addConstraintViolation()
            return false
        }

        if (request.takeItemIds.isNotEmpty() && request.targetLocationId == null) {
            context
                .buildConstraintViolationWithTemplate(
                    "targetLocationId must be provided if takeItemIds is not empty"
                )
                .addConstraintViolation()

            return false
        }

        val overlap = request.takeItemIds.toSet().intersect(request.returnItemIds.toSet())
        if (overlap.isNotEmpty()) {
            context
                .buildConstraintViolationWithTemplate(
                    "Same item cannot appear in both takeItemIds and returnItemIds"
                )
                .addConstraintViolation()
            return false
        }

        return true
    }
}
