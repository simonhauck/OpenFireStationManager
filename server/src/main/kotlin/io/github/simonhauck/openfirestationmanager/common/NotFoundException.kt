package io.github.simonhauck.openfirestationmanager.common

import org.springframework.http.HttpStatus

open class NotFoundException(
    publicMessage: String = "Resource not found",
    reason: String? = null,
    cause: Throwable? = null,
) : PublicApiException(HttpStatus.NOT_FOUND, publicMessage, reason, cause)
