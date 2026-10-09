package io.github.simonhauck.openfirestationmanager.clothing.type

import org.springframework.boot.resttestclient.TestRestTemplate
import org.springframework.boot.resttestclient.exchange
import org.springframework.core.io.ByteArrayResource
import org.springframework.http.HttpEntity
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpMethod
import org.springframework.http.MediaType
import org.springframework.http.ProblemDetail
import org.springframework.http.ResponseEntity
import org.springframework.stereotype.Component
import org.springframework.util.LinkedMultiValueMap

@Component
class ClothingTypeImageControllerCalls(private val testRestTemplate: TestRestTemplate) {

    fun uploadImage(
        typeId: Long,
        fileName: String,
        contentType: String,
        content: ByteArray,
        authCookie: String? = null,
    ): ResponseEntity<ClothingTypeImageMetadata> {
        val filePartHeaders =
            HttpHeaders().apply { this.contentType = MediaType.parseMediaType(contentType) }
        val fileResource =
            object : ByteArrayResource(content) {
                override fun getFilename(): String = fileName
            }
        val body = LinkedMultiValueMap<String, Any>()
        body.add("file", HttpEntity(fileResource, filePartHeaders))

        val headers = headersWithCookie(authCookie)
        headers.contentType = MediaType.MULTIPART_FORM_DATA

        return testRestTemplate.exchange<ClothingTypeImageMetadata>(
            "/api/clothing/types/$typeId/images",
            HttpMethod.POST,
            HttpEntity(body, headers),
        )
    }

    fun getImage(
        typeId: Long,
        imageId: Long,
        authCookie: String? = null,
    ): ResponseEntity<ByteArray> {
        return testRestTemplate.exchange<ByteArray>(
            "/api/clothing/types/$typeId/images/$imageId",
            HttpMethod.GET,
            HttpEntity<Unit>(headersWithCookie(authCookie)),
        )
    }

    fun listImages(
        typeId: Long,
        authCookie: String? = null,
    ): ResponseEntity<Array<ClothingTypeImageMetadata>> {
        return testRestTemplate.exchange<Array<ClothingTypeImageMetadata>>(
            "/api/clothing/types/$typeId/images",
            HttpMethod.GET,
            HttpEntity<Unit>(headersWithCookie(authCookie)),
        )
    }

    fun getImageExpectingError(
        typeId: Long,
        imageId: Long,
        authCookie: String? = null,
    ): ResponseEntity<ProblemDetail> {
        return testRestTemplate.exchange<ProblemDetail>(
            "/api/clothing/types/$typeId/images/$imageId",
            HttpMethod.GET,
            HttpEntity<Unit>(headersWithCookie(authCookie)),
        )
    }

    fun deleteImage(
        typeId: Long,
        imageId: Long,
        authCookie: String? = null,
    ): ResponseEntity<Void> {
        return testRestTemplate.exchange<Void>(
            "/api/clothing/types/$typeId/images/$imageId",
            HttpMethod.DELETE,
            HttpEntity<Unit>(headersWithCookie(authCookie)),
        )
    }

    fun listBarcodeImages(
        authCookie: String? = null
    ): ResponseEntity<Array<ClothingTypeBarcodeImages>> {
        return testRestTemplate.exchange<Array<ClothingTypeBarcodeImages>>(
            "/api/clothing/types/barcode-images",
            HttpMethod.GET,
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
