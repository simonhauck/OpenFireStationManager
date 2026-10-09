package io.github.simonhauck.openfirestationmanager.clothing.type

import io.github.simonhauck.openfirestationmanager.IntegrationTest
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpStatus
import org.springframework.http.MediaType

class ClothingTypeImageControllerIT : IntegrationTest() {

    @Autowired private lateinit var calls: ClothingTypeImageControllerCalls
    @Autowired private lateinit var typeCalls: ProtectiveClothingTypeControllerCalls

    @Test
    fun `uploadImage should store a JPEG for a clothing type and return its metadata`() {
        val type = createType()

        val content = "fake-jpeg-content".toByteArray()
        val response =
            calls.uploadImage(
                typeId = type.id,
                fileName = "barcode-jacket.jpg",
                contentType = "image/jpeg",
                content = content,
                authCookie = validCookieHeader,
            )

        assertThat(response.statusCode).isEqualTo(HttpStatus.OK)
        assertThat(response.body?.id).isGreaterThan(0)
        assertThat(response.body?.contentType).isEqualTo("image/jpeg")
        assertThat(response.body?.fileSize).isEqualTo(content.size.toLong())
    }

    @Test
    fun `getImage should return the stored bytes with the uploaded content type`() {
        val type = createType()
        val content = "fake-png-content".toByteArray()
        val uploaded =
            calls
                .uploadImage(
                    typeId = type.id,
                    fileName = "barcode-gloves.png",
                    contentType = "image/png",
                    content = content,
                    authCookie = validCookieHeader,
                )
                .body!!

        val response = calls.getImage(type.id, uploaded.id, authCookie = validCookieHeader)

        assertThat(response.statusCode).isEqualTo(HttpStatus.OK)
        assertThat(response.headers.contentType).isEqualTo(MediaType.IMAGE_PNG)
        assertThat(response.headers.getFirst(HttpHeaders.CACHE_CONTROL)).contains("immutable")
        assertThat(response.body!!).isEqualTo(content)
    }

    @Test
    fun `listImages should return metadata for every image of a type in upload order`() {
        val type = createType()
        val first =
            calls
                .uploadImage(
                    typeId = type.id,
                    fileName = "first.jpg",
                    contentType = "image/jpeg",
                    content = "first".toByteArray(),
                    authCookie = validCookieHeader,
                )
                .body!!
        val second =
            calls
                .uploadImage(
                    typeId = type.id,
                    fileName = "second.webp",
                    contentType = "image/webp",
                    content = "second".toByteArray(),
                    authCookie = validCookieHeader,
                )
                .body!!

        val response = calls.listImages(type.id, authCookie = validCookieHeader)

        assertThat(response.statusCode).isEqualTo(HttpStatus.OK)
        assertThat(response.body?.map { it.id }).containsExactly(first.id, second.id)
        assertThat(response.body?.map { it.contentType })
            .containsExactly("image/jpeg", "image/webp")
    }

    @Test
    fun `deleteImage should remove the image so that it can no longer be downloaded`() {
        val type = createType()
        val uploaded =
            calls
                .uploadImage(
                    typeId = type.id,
                    fileName = "to-delete.jpg",
                    contentType = "image/jpeg",
                    content = "content".toByteArray(),
                    authCookie = validCookieHeader,
                )
                .body!!

        val deleteResponse = calls.deleteImage(type.id, uploaded.id, authCookie = validCookieHeader)

        assertThat(deleteResponse.statusCode).isEqualTo(HttpStatus.NO_CONTENT)
        val getResponse =
            calls.getImageExpectingError(type.id, uploaded.id, authCookie = validCookieHeader)
        assertThat(getResponse.statusCode).isEqualTo(HttpStatus.NOT_FOUND)
    }

    @Test
    fun `listBarcodeImages should return the types that have images with their metadata grouped`() {
        val typeWithImages = createType()
        val typeWithoutImages = createType()
        val first =
            calls
                .uploadImage(
                    typeId = typeWithImages.id,
                    fileName = "one.jpg",
                    contentType = "image/jpeg",
                    content = "one".toByteArray(),
                    authCookie = validCookieHeader,
                )
                .body!!
        val second =
            calls
                .uploadImage(
                    typeId = typeWithImages.id,
                    fileName = "two.jpg",
                    contentType = "image/jpeg",
                    content = "two".toByteArray(),
                    authCookie = validCookieHeader,
                )
                .body!!

        val response = calls.listBarcodeImages(authCookie = validCookieHeader)

        assertThat(response.statusCode).isEqualTo(HttpStatus.OK)
        val entry = response.body?.single { it.typeId == typeWithImages.id }
        assertThat(entry?.typeName).isEqualTo(typeWithImages.name)
        assertThat(entry?.images?.map { it.id }).containsExactly(first.id, second.id)
        assertThat(response.body?.map { it.typeId }).doesNotContain(typeWithoutImages.id)
    }

    @Test
    fun `deleting a clothing type should delete its images`() {
        val type = createType()
        val uploaded =
            calls
                .uploadImage(
                    typeId = type.id,
                    fileName = "cascade.jpg",
                    contentType = "image/jpeg",
                    content = "cascade".toByteArray(),
                    authCookie = validCookieHeader,
                )
                .body!!

        val deleteResponse = typeCalls.deleteType(type.id, authCookie = validCookieHeader)

        assertThat(deleteResponse.statusCode).isEqualTo(HttpStatus.NO_CONTENT)
        val getResponse =
            calls.getImageExpectingError(type.id, uploaded.id, authCookie = validCookieHeader)
        assertThat(getResponse.statusCode).isEqualTo(HttpStatus.NOT_FOUND)
    }

    private fun createType(): ClothingType =
        typeCalls
            .createType(
                CreateOrUpdateClothingTypeRequest(name = "BarcodeBildTyp-${System.nanoTime()}"),
                authCookie = validCookieHeader,
            )
            .body!!
}
