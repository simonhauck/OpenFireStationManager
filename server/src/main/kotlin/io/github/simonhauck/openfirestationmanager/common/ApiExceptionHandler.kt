package io.github.simonhauck.openfirestationmanager.common

import io.github.oshai.kotlinlogging.KotlinLogging
import io.swagger.v3.oas.annotations.media.Schema
import jakarta.validation.ConstraintViolationException
import org.springframework.http.HttpStatus
import org.springframework.http.ProblemDetail
import org.springframework.security.access.AccessDeniedException
import org.springframework.security.authentication.BadCredentialsException
import org.springframework.web.bind.MethodArgumentNotValidException
import org.springframework.web.bind.annotation.ExceptionHandler
import org.springframework.web.bind.annotation.RestControllerAdvice
import org.springframework.web.method.annotation.HandlerMethodValidationException

/** One field that failed validation, together with the value that was rejected. */
@Schema(description = "A single field-level validation failure.")
data class ValidationError(
    @field:Schema(
        description =
            "Path of the offending field within the request body, e.g. `size`. " +
                "Empty when the rule applies to the request as a whole rather than one field.",
        example = "size",
    )
    val field: String,
    @field:Schema(
        description = "Human-readable reason the value was rejected.",
        example = "must not be blank",
    )
    val message: String,
    @field:Schema(description = "The value that was submitted and rejected. May be null.")
    val rejectedValue: Any?,
)

/**
 * Documentation-only view of the body returned for a `400 Bad Request` validation failure.
 *
 * The handler below emits a [ProblemDetail] with an extra `errors` property; Swagger cannot infer
 * that extension from `setProperty`, so the shape is declared explicitly here. The exact wire
 * format is pinned by the snapshot in `expected_failed_create_user_response.json`.
 */
@Schema(
    name = "ValidationProblemDetail",
    description =
        "RFC 9457 problem document describing a request that failed validation, " +
            "extended with an `errors` array naming each offending field.",
)
data class ValidationProblemDetail(
    @field:Schema(example = "about:blank") val type: String,
    @field:Schema(example = "Invalid request") val title: String,
    @field:Schema(example = "400") val status: Int,
    @field:Schema(example = "Validation failed for request body") val detail: String,
    @field:Schema(description = "URI of the request that failed, when available.")
    val instance: String?,
    @field:Schema(description = "Every field-level failure detected in this request.")
    val errors: List<ValidationError>,
)

@RestControllerAdvice
class ApiExceptionHandler {
    private val log = KotlinLogging.logger {}

    @ExceptionHandler(PublicApiException::class)
    fun handlePublicApiException(exception: PublicApiException): ProblemDetail {
        return ProblemDetail.forStatusAndDetail(exception.statusCode, exception.publicMessage)
    }

    @ExceptionHandler(MethodArgumentNotValidException::class)
    fun handleMethodArgumentNotValidException(
        exception: MethodArgumentNotValidException
    ): ProblemDetail {
        val errors =
            exception.bindingResult.fieldErrors.map {
                ValidationError(
                    field = it.field,
                    message = it.defaultMessage ?: "Invalid value",
                    rejectedValue = it.rejectedValue,
                )
            }

        return validationProblem(errors)
    }

    /**
     * Handles constraint violations on `@PathVariable` / `@RequestParam` arguments.
     *
     * Controllers annotated `@Validated` are validated by a Spring AOP proxy, which reports
     * failures as [ConstraintViolationException]. Without this handler the catch-all
     * [handleGenericException] below would swallow it and report a misleading `500` for what is
     * plainly a malformed request.
     */
    @ExceptionHandler(ConstraintViolationException::class)
    fun handleConstraintViolationException(exception: ConstraintViolationException): ProblemDetail {
        val errors =
            exception.constraintViolations.map { violation ->
                ValidationError(
                    field = violation.propertyPath.lastOrNull()?.name ?: "",
                    message = violation.message ?: "Invalid value",
                    rejectedValue = violation.invalidValue,
                )
            }

        return validationProblem(errors, "Validation failed for request parameters")
    }

    /**
     * Handles constraint violations detected by Spring MVC's built-in method validation, which
     * applies to handlers on controllers that are not annotated `@Validated`.
     */
    @ExceptionHandler(HandlerMethodValidationException::class)
    fun handleHandlerMethodValidationException(
        exception: HandlerMethodValidationException
    ): ProblemDetail {
        val errors =
            exception.parameterValidationResults.flatMap { result ->
                result.resolvableErrors.map { error ->
                    ValidationError(
                        field = result.methodParameter.parameterName ?: "",
                        message = error.defaultMessage ?: "Invalid value",
                        rejectedValue = result.argument,
                    )
                }
            }

        return validationProblem(errors, "Validation failed for request parameters")
    }

    @ExceptionHandler(Exception::class)
    fun handleGenericException(exception: Exception): ProblemDetail {
        log.error(exception) { "Unexpected exception thrown: ${exception.message}" }
        return ProblemDetail.forStatusAndDetail(
            HttpStatus.INTERNAL_SERVER_ERROR,
            "An unexpected error occurred",
        )
    }

    @ExceptionHandler(BadCredentialsException::class)
    fun handleBadCredentialsException(exception: BadCredentialsException): ProblemDetail {
        log.warn {
            "Login attempt with invalid credentials registered for user: ${exception.authenticationRequest?.name}"
        }
        return ProblemDetail.forStatusAndDetail(
            HttpStatus.UNAUTHORIZED,
            "Invalid username or password",
        )
    }

    @ExceptionHandler(AccessDeniedException::class)
    fun handleAccessDeniedException(exception: AccessDeniedException): ProblemDetail {
        return ProblemDetail.forStatusAndDetail(HttpStatus.FORBIDDEN, "Access denied")
    }

    private fun validationProblem(
        errors: List<ValidationError>,
        detail: String = "Validation failed for request body",
    ): ProblemDetail {
        val problemDetail = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, detail)
        problemDetail.title = "Invalid request"
        problemDetail.setProperty("errors", errors)
        return problemDetail
    }
}
