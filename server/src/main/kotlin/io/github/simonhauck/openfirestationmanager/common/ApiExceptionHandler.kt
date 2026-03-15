package io.github.simonhauck.openfirestationmanager.common

import io.github.oshai.kotlinlogging.KotlinLogging
import org.springframework.http.HttpStatus
import org.springframework.http.ProblemDetail
import org.springframework.web.bind.MethodArgumentNotValidException
import org.springframework.web.bind.annotation.ExceptionHandler
import org.springframework.web.bind.annotation.RestControllerAdvice

@RestControllerAdvice
class ApiExceptionHandler {
    private val log = KotlinLogging.logger {}

    data class ValidationError(
        val field: String,
        val message: String,
        val rejectedValue: Any?,
    )

    @ExceptionHandler(PublicApiException::class)
    fun handlePublicApiException(exception: PublicApiException): ProblemDetail {
        return ProblemDetail.forStatusAndDetail(exception.statusCode, exception.publicMessage)
    }

    @ExceptionHandler(MethodArgumentNotValidException::class)
    fun handleMethodArgumentNotValidException(
        exception: MethodArgumentNotValidException
    ): ProblemDetail {
        val problemDetail =
            ProblemDetail.forStatusAndDetail(
                HttpStatus.BAD_REQUEST,
                "Validation failed for request body",
            )
        problemDetail.title = "Invalid request"

        val errors =
            exception.bindingResult.fieldErrors.map {
                ValidationError(
                    field = it.field,
                    message = it.defaultMessage ?: "Invalid value",
                    rejectedValue = it.rejectedValue,
                )
            }

        problemDetail.setProperty("errors", errors)
        return problemDetail
    }

    @ExceptionHandler(Exception::class)
    fun handleGenericException(exception: Exception): ProblemDetail {
        log.error(exception) { "Unexpected exception thrown: ${exception.message}" }
        return ProblemDetail.forStatusAndDetail(
            HttpStatus.INTERNAL_SERVER_ERROR,
            "An unexpected error occurred",
        )
    }
}
