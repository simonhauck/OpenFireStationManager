package io.github.simonhauck.openfirestationmanager.common

import org.springframework.http.HttpStatusCode
import org.springframework.web.server.ResponseStatusException

class PublicApiException(
    status: HttpStatusCode,
    val publicMessage: String,
    reason: String? = null,
    cause: Throwable? = null,
) : ResponseStatusException(status, reason, cause)
