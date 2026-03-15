package io.github.simonhauck.openfirestationmanager.common

import org.springframework.http.HttpStatus
import org.springframework.http.ProblemDetail
import org.springframework.web.bind.annotation.ExceptionHandler
import org.springframework.web.bind.annotation.RestControllerAdvice

@RestControllerAdvice
class ApiExceptionHandler {
    @ExceptionHandler(PublicApiException::class)
    fun handlePublicApiException(exception: PublicApiException): ProblemDetail {
        return ProblemDetail.forStatusAndDetail(exception.statusCode, exception.publicMessage)
    }

    @ExceptionHandler(IllegalArgumentException::class)
    fun handleIllegalArgumentException(exception: IllegalArgumentException): ProblemDetail {
        return ProblemDetail.forStatusAndDetail(
            HttpStatus.BAD_REQUEST,
            exception.message ?: "Invalid request",
        )
    }

    @ExceptionHandler(Exception::class)
    fun handleGenericException(exception: Exception): ProblemDetail {
        return ProblemDetail.forStatusAndDetail(
            HttpStatus.INTERNAL_SERVER_ERROR,
            "An unexpected error occurred",
        )
    }
}
