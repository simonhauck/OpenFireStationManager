package io.github.simonhauck.openfirestationmanager.testing

import io.github.simonhauck.openfirestationmanager.IntegrationTest
import io.github.simonhauck.openfirestationmanager.clothing.type.ClothingType
import io.github.simonhauck.openfirestationmanager.clothing.type.CreateOrUpdateClothingTypeRequest
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.springframework.boot.resttestclient.postForEntity
import org.springframework.http.HttpStatus

class TestSeedingControllerIT : IntegrationTest() {

    @Test
    fun `seedClothingType should create a type without authentication`() {
        val name = "SeedType-${System.nanoTime()}"

        val response =
            http.postForEntity<ClothingType>(
                "/api/test/clothing-types",
                CreateOrUpdateClothingTypeRequest(name = name),
            )

        assertThat(response.statusCode).isEqualTo(HttpStatus.OK)
        assertThat(response.body?.id).isGreaterThan(0)
        assertThat(response.body?.name).isEqualTo(name)
    }
}
