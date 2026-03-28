package io.github.simonhauck.openfirestationmanager

import io.github.simonhauck.openfirestationmanager.testutil.ResourceLoader
import java.io.File
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.resttestclient.TestRestTemplate
import org.springframework.boot.resttestclient.getForObject
import tools.jackson.databind.JsonNode
import tools.jackson.databind.json.JsonMapper
import tools.jackson.databind.node.ObjectNode

class HttpApiContractIT : IntegrationTest() {

    @Autowired private lateinit var restTemplate: TestRestTemplate

    @Autowired private lateinit var objectMapper: JsonMapper

    private val resourceLoader = ResourceLoader(javaClass)

    @Test
    fun `should match the http api definition specified in the API file`() {
        val actual = restTemplate.getForObject<String>("/api/public/schema.json")
        val expected = resourceLoader.readFromClassLoader("open-api-contract.json")

        val actualJson = objectMapper.readTree(actual) as ObjectNode
        val expectedJson = objectMapper.readTree(expected) as ObjectNode

        actualJson.remove("servers")
        expectedJson.remove("servers")

        runCatching { assertThat(actualJson.toString()).isEqualTo(expectedJson.toString()) }
            .recoverCatching { checkIfApiShouldBeUpdated(actualJson, it) }
            .getOrThrow()
    }

    private fun checkIfApiShouldBeUpdated(actual: JsonNode, throwable: Throwable) {
        if (System.getenv("UPDATE_SNAPSHOT") != "true") throw throwable

        val openApiPath = File("src/main/resources/open-api-contract.json")
        openApiPath.writeText(actual.toPrettyString())
    }
}
