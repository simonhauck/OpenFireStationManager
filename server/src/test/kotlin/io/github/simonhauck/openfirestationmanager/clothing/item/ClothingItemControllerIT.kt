package io.github.simonhauck.openfirestationmanager.clothing.item

import io.github.simonhauck.openfirestationmanager.IntegrationTest
import io.github.simonhauck.openfirestationmanager.clothing.type.ClothingType
import io.github.simonhauck.openfirestationmanager.clothing.type.CreateOrUpdateClothingTypeRequest
import io.github.simonhauck.openfirestationmanager.clothing.type.ProtectiveClothingTypeControllerCalls
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.http.HttpStatus

class ClothingItemControllerIT : IntegrationTest() {

    @Autowired private lateinit var itemCalls: ClothingItemControllerCalls

    @Autowired private lateinit var typeCalls: ProtectiveClothingTypeControllerCalls

    @Test
    fun `createItem should create a new clothing item when authenticated`() {
        val type = createType()
        val request = CreateOrUpdateClothingItemRequest(typeId = type.id, size = "L")

        val response = itemCalls.createItem(request, authCookie = validCookieHeader)

        assertThat(response.statusCode).isEqualTo(HttpStatus.OK)
        assertThat(response.body?.typeId?.id).isEqualTo(type.id)
        assertThat(response.body?.size).isEqualTo("L")
        assertThat(response.body?.id).isGreaterThan(0)
    }

    @Test
    fun `getItemById should return the item when it exists`() {
        val type = createType()
        val created =
            itemCalls
                .createItem(
                    CreateOrUpdateClothingItemRequest(typeId = type.id, size = "M"),
                    authCookie = validCookieHeader,
                )
                .body!!

        val response = itemCalls.getItemById(created.id, authCookie = validCookieHeader)

        assertThat(response.statusCode).isEqualTo(HttpStatus.OK)
        assertThat(response.body?.id).isEqualTo(created.id)
        assertThat(response.body?.typeId?.id).isEqualTo(type.id)
        assertThat(response.body?.size).isEqualTo("M")
    }

    @Test
    fun `updateItem should update an existing clothing item`() {
        val originalType = createType("Original-Type-${System.nanoTime()}")
        val replacementType = createType("Replacement-Type-${System.nanoTime()}")
        val created =
            itemCalls
                .createItem(
                    CreateOrUpdateClothingItemRequest(typeId = originalType.id, size = "S"),
                    authCookie = validCookieHeader,
                )
                .body!!

        val response =
            itemCalls.updateItem(
                created.id,
                CreateOrUpdateClothingItemRequest(typeId = replacementType.id, size = "XL"),
                authCookie = validCookieHeader,
            )

        assertThat(response.statusCode).isEqualTo(HttpStatus.OK)
        assertThat(response.body?.id).isEqualTo(created.id)
        assertThat(response.body?.typeId?.id).isEqualTo(replacementType.id)
        assertThat(response.body?.size).isEqualTo("XL")
    }

    @Test
    fun `deleteItem should delete an existing clothing item`() {
        val type = createType()
        val created =
            itemCalls
                .createItem(
                    CreateOrUpdateClothingItemRequest(typeId = type.id, size = "L"),
                    authCookie = validCookieHeader,
                )
                .body!!

        val deleteResponse = itemCalls.deleteItem(created.id, authCookie = validCookieHeader)

        assertThat(deleteResponse.statusCode).isEqualTo(HttpStatus.NO_CONTENT)
    }

    @Test
    fun `getAllItems should include created items`() {
        val type = createType()
        val uniqueSize = "Size-${System.nanoTime()}"
        val created =
            itemCalls
                .createItem(
                    CreateOrUpdateClothingItemRequest(typeId = type.id, size = uniqueSize),
                    authCookie = validCookieHeader,
                )
                .body!!

        val response = itemCalls.getAllItems(authCookie = validCookieHeader)

        assertThat(response.statusCode).isEqualTo(HttpStatus.OK)
        assertThat(response.body?.map { it.id }).contains(created.id)
        assertThat(response.body?.map { it.size }).contains(uniqueSize)
    }

    @Test
    fun `getSummaryByTypeAndSize should group counts by clothing type and size`() {
        val summaryTypeName = "Summary-Type-${System.nanoTime()}"
        val type = createType(summaryTypeName)
        itemCalls.createItem(
            CreateOrUpdateClothingItemRequest(typeId = type.id, size = "M"),
            authCookie = validCookieHeader,
        )
        itemCalls.createItem(
            CreateOrUpdateClothingItemRequest(typeId = type.id, size = "M"),
            authCookie = validCookieHeader,
        )
        itemCalls.createItem(
            CreateOrUpdateClothingItemRequest(typeId = type.id, size = "L"),
            authCookie = validCookieHeader,
        )

        val response = itemCalls.getSummaryByTypeAndSize(authCookie = validCookieHeader)

        assertThat(response.statusCode).isEqualTo(HttpStatus.OK)

        val summaryForType = response.body?.firstOrNull { it.typeId == type.id }
        assertThat(summaryForType).isNotNull
        assertThat(summaryForType?.typeName).isEqualTo(summaryTypeName)
        assertThat(summaryForType?.sizeCounts).containsEntry("M", 2).containsEntry("L", 1)
    }

    private fun createType(name: String = "Type-${System.nanoTime()}"): ClothingType {
        return typeCalls
            .createType(
                CreateOrUpdateClothingTypeRequest(name = name),
                authCookie = validCookieHeader,
            )
            .body!!
    }
}
