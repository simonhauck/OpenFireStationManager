package io.github.simonhauck.openfirestationmanager.clothing.type

import org.springframework.boot.resttestclient.TestRestTemplate
import org.springframework.boot.resttestclient.exchange
import org.springframework.boot.resttestclient.postForEntity
import org.springframework.http.HttpEntity
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpMethod
import org.springframework.http.ProblemDetail
import org.springframework.http.ResponseEntity
import org.springframework.stereotype.Component

@Component
class ProtectiveClothingTypeControllerCalls(private val testRestTemplate: TestRestTemplate) {

    fun getAllTypes(authCookie: String? = null): ResponseEntity<Array<ClothingType>> {
        return testRestTemplate.exchange<Array<ClothingType>>(
            "/api/clothing/types",
            HttpMethod.GET,
            HttpEntity<Unit>(headersWithCookie(authCookie)),
        )
    }

    fun getAllTypesExpectingError(authCookie: String? = null): ResponseEntity<ProblemDetail> {
        return testRestTemplate.exchange<ProblemDetail>(
            "/api/clothing/types",
            HttpMethod.GET,
            HttpEntity<Unit>(headersWithCookie(authCookie)),
        )
    }

    fun getTypeById(id: Long, authCookie: String? = null): ResponseEntity<ClothingType> {
        return testRestTemplate.exchange<ClothingType>(
            "/api/clothing/types/$id",
            HttpMethod.GET,
            HttpEntity<Unit>(headersWithCookie(authCookie)),
        )
    }

    fun getTypeByIdExpectingError(
        id: Long,
        authCookie: String? = null,
    ): ResponseEntity<ProblemDetail> {
        return testRestTemplate.exchange<ProblemDetail>(
            "/api/clothing/types/$id",
            HttpMethod.GET,
            HttpEntity<Unit>(headersWithCookie(authCookie)),
        )
    }

    fun createType(
        request: CreateOrUpdateClothingTypeRequest,
        authCookie: String? = null,
    ): ResponseEntity<ClothingType> {
        return testRestTemplate.postForEntity<ClothingType>(
            "/api/clothing/types",
            HttpEntity(request, headersWithCookie(authCookie)),
        )
    }

    fun createTypeExpectingError(
        request: CreateOrUpdateClothingTypeRequest,
        authCookie: String? = null,
    ): ResponseEntity<ProblemDetail> {
        return testRestTemplate.postForEntity<ProblemDetail>(
            "/api/clothing/types",
            HttpEntity(request, headersWithCookie(authCookie)),
        )
    }

    fun updateType(
        id: Long,
        request: CreateOrUpdateClothingTypeRequest,
        authCookie: String? = null,
    ): ResponseEntity<ClothingType> {
        return testRestTemplate.exchange<ClothingType>(
            "/api/clothing/types/$id",
            HttpMethod.PATCH,
            HttpEntity(request, headersWithCookie(authCookie)),
        )
    }

    fun updateTypeExpectingError(
        id: Long,
        request: CreateOrUpdateClothingTypeRequest,
        authCookie: String? = null,
    ): ResponseEntity<ProblemDetail> {
        return testRestTemplate.exchange<ProblemDetail>(
            "/api/clothing/types/$id",
            HttpMethod.PATCH,
            HttpEntity(request, headersWithCookie(authCookie)),
        )
    }

    fun deleteType(id: Long, authCookie: String? = null): ResponseEntity<Void> {
        return testRestTemplate.exchange<Void>(
            "/api/clothing/types/$id",
            HttpMethod.DELETE,
            HttpEntity<Unit>(headersWithCookie(authCookie)),
        )
    }

    fun deleteTypeExpectingError(
        id: Long,
        authCookie: String? = null,
    ): ResponseEntity<ProblemDetail> {
        return testRestTemplate.exchange<ProblemDetail>(
            "/api/clothing/types/$id",
            HttpMethod.DELETE,
            HttpEntity<Unit>(headersWithCookie(authCookie)),
        )
    }

    private fun headersWithCookie(authCookie: String?): HttpHeaders {
        val headers = HttpHeaders()
        if (authCookie != null) {
            headers.add(HttpHeaders.COOKIE, authCookie)
        }
        return headers
    }
}
