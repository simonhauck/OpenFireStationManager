package io.github.simonhauck.openfirestationmanager.protectiveclothing

import io.github.simonhauck.openfirestationmanager.IntegrationTest
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.http.HttpStatus

class ProtectiveClothingTypeControllerIT : IntegrationTest() {

    @Autowired private lateinit var calls: ProtectiveClothingTypeControllerCalls

    @Test
    fun `createType should create a new protective clothing type when authenticated`() {
        val request = CreateProtectiveClothingTypeRequest(name = "Helmet")

        val response = calls.createType(request, authCookie = validCookieHeader)

        assertThat(response.statusCode).isEqualTo(HttpStatus.OK)
        assertThat(response.body?.name).isEqualTo("Helmet")
        assertThat(response.body?.id).isGreaterThan(0)
    }

    @Test
    fun `getTypeById should return the type when it exists`() {
        val created =
            calls.createType(
                CreateProtectiveClothingTypeRequest(name = "Gloves"),
                authCookie = validCookieHeader,
            ).body!!

        val response = calls.getTypeById(created.id, authCookie = validCookieHeader)

        assertThat(response.statusCode).isEqualTo(HttpStatus.OK)
        assertThat(response.body?.id).isEqualTo(created.id)
        assertThat(response.body?.name).isEqualTo("Gloves")
    }

    @Test
    fun `updateType should update the name of an existing type`() {
        val created =
            calls.createType(
                CreateProtectiveClothingTypeRequest(name = "Old Name"),
                authCookie = validCookieHeader,
            ).body!!

        val response =
            calls.updateType(
                created.id,
                UpdateProtectiveClothingTypeRequest(name = "New Name"),
                authCookie = validCookieHeader,
            )

        assertThat(response.statusCode).isEqualTo(HttpStatus.OK)
        assertThat(response.body?.id).isEqualTo(created.id)
        assertThat(response.body?.name).isEqualTo("New Name")
    }

    @Test
    fun `deleteType should delete an existing type`() {
        val created =
            calls.createType(
                CreateProtectiveClothingTypeRequest(name = "To Delete"),
                authCookie = validCookieHeader,
            ).body!!

        val deleteResponse = calls.deleteType(created.id, authCookie = validCookieHeader)

        assertThat(deleteResponse.statusCode).isEqualTo(HttpStatus.NO_CONTENT)
    }

    @Test
    fun `getAllTypes should include created types`() {
        val typeName = "Boots-${System.nanoTime()}"
        calls.createType(
            CreateProtectiveClothingTypeRequest(name = typeName),
            authCookie = validCookieHeader,
        )

        val response = calls.getAllTypes(authCookie = validCookieHeader)

        assertThat(response.statusCode).isEqualTo(HttpStatus.OK)
        assertThat(response.body?.map { it.name }).contains(typeName)
    }
}
