package io.github.simonhauck.openfirestationmanager.common

import org.springframework.http.HttpStatus

open class ConflictException(
    publicMessage: String = "Resource already exists",
    reason: String? = null,
    cause: Throwable? = null,
) : PublicApiException(HttpStatus.CONFLICT, publicMessage, reason, cause)
