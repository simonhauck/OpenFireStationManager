package io.github.simonhauck.openfirestationmanager.mcp

import io.github.simonhauck.openfirestationmanager.IntegrationTest
import io.github.simonhauck.openfirestationmanager.clothing.type.CreateOrUpdateClothingTypeRequest
import io.github.simonhauck.openfirestationmanager.clothing.type.ProtectiveClothingTypeControllerCalls
import java.net.URI
import java.net.URLEncoder
import java.net.http.HttpClient
import java.net.http.HttpRequest
import java.net.http.HttpResponse
import java.nio.charset.StandardCharsets
import java.util.UUID
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.beans.factory.annotation.Value
import org.springframework.web.util.UriComponentsBuilder
import tools.jackson.databind.json.JsonMapper

/**
 * Calls `/mcp` with access tokens issued by the mock OpenID Connect provider. The tokens come from
 * a real authorization code flow against the provider (its login form accepts extra claims, which
 * end up in the access token), so signature, issuer and audience are validated for real.
 */
class McpEndpointIT : IntegrationTest() {

    @Value("\${local.server.port}") private var port: Int = 0

    @Autowired private lateinit var jsonMapper: JsonMapper
    @Autowired private lateinit var typeCalls: ProtectiveClothingTypeControllerCalls

    private val client: HttpClient =
        HttpClient.newBuilder()
            .version(HttpClient.Version.HTTP_1_1)
            .followRedirects(HttpClient.Redirect.NEVER)
            .build()

    @Test
    fun `a token with a mapped role lists and calls a read-only tool`() {
        val typeName = "Mcp-${UUID.randomUUID()}"
        typeCalls.createType(
            CreateOrUpdateClothingTypeRequest(name = typeName),
            authCookie = validCookieHeader,
        )
        val token = accessToken(audience = "ofsm", roles = listOf("ofsm-user"))

        val initialize =
            mcp(
                """{"jsonrpc":"2.0","id":1,"method":"initialize","params":""" +
                    """{"protocolVersion":"2025-06-18","capabilities":{},""" +
                    """"clientInfo":{"name":"it","version":"1"}}}""",
                token,
            )
        assertThat(initialize.statusCode()).isEqualTo(200)
        assertThat(result(initialize)["protocolVersion"]).isEqualTo("2025-06-18")

        val initialized =
            mcp("""{"jsonrpc":"2.0","method":"notifications/initialized"}""", token)
        assertThat(initialized.statusCode()).isEqualTo(202)

        val list = mcp("""{"jsonrpc":"2.0","id":2,"method":"tools/list"}""", token)
        assertThat(list.statusCode()).isEqualTo(200)
        val toolNames = (result(list)["tools"] as List<*>).map { (it as Map<*, *>)["name"] }
        assertThat(toolNames)
            .contains(
                "listClothingTypes",
                "listClothingLocations",
                "getClothingItemByBarcode",
                "searchClothingItems",
                "listMembers",
            )

        val call =
            mcp(
                """{"jsonrpc":"2.0","id":3,"method":"tools/call",""" +
                    """"params":{"name":"listClothingTypes","arguments":{}}}""",
                token,
            )
        assertThat(call.statusCode()).isEqualTo(200)
        val callResult = result(call)
        assertThat(callResult["isError"]).isEqualTo(false)
        val text = ((callResult["content"] as List<*>).single() as Map<*, *>)["text"] as String
        assertThat(text).contains(typeName)

        listOf(initialize, initialized, list, call).forEach {
            assertThat(it.headers().allValues("Set-Cookie")).isEmpty()
        }
    }

    @Test
    fun `an unauthenticated call gets 401 with a pointer to the protected resource metadata`() {
        val response = mcp("""{"jsonrpc":"2.0","id":1,"method":"tools/list"}""", token = null)

        assertThat(response.statusCode()).isEqualTo(401)
        val metadataUrl = "http://localhost:$port/.well-known/oauth-protected-resource/mcp"
        assertThat(response.headers().firstValue("WWW-Authenticate").orElse(""))
            .startsWith("Bearer ")
            .contains("resource_metadata=\"$metadataUrl\"")
        assertThat(response.headers().allValues("Set-Cookie")).isEmpty()

        val metadata = send(HttpRequest.newBuilder(URI.create(metadataUrl)).GET().build())
        assertThat(metadata.statusCode()).isEqualTo(200)
        val body = jsonMapper.readValue(metadata.body(), Map::class.java)
        assertThat(body["resource"]).isEqualTo("http://localhost:$port/mcp")
        assertThat(body["authorization_servers"]).isEqualTo(listOf(oidcProvider.issuerUri()))
        assertThat(metadata.headers().allValues("Set-Cookie")).isEmpty()
    }

    @Test
    fun `a token issued for another application is rejected`() {
        val token = accessToken(audience = "another-application", roles = listOf("ofsm-admin"))

        val response = mcp("""{"jsonrpc":"2.0","id":1,"method":"tools/list"}""", token)

        assertThat(response.statusCode()).isEqualTo(401)
        assertThat(response.headers().firstValue("WWW-Authenticate").orElse(""))
            .contains("error=\"invalid_token\"")
            .contains("resource_metadata=")
    }

    private fun mcp(body: String, token: String?): HttpResponse<String> {
        val builder =
            HttpRequest.newBuilder(URI.create("http://localhost:$port/mcp"))
                .header("Content-Type", "application/json")
                .header("Accept", "application/json, text/event-stream")
                .POST(HttpRequest.BodyPublishers.ofString(body))
        if (token != null) builder.header("Authorization", "Bearer $token")
        return send(builder.build())
    }

    private fun result(response: HttpResponse<String>): Map<*, *> {
        val message = jsonMapper.readValue(response.body(), Map::class.java)
        assertThat(message["error"]).isNull()
        return message["result"] as Map<*, *>
    }

    /**
     * Runs the authorization code flow against the mock provider as an MCP client would, with the
     * given `aud` and realm roles as extra claims, and returns the access token.
     */
    private fun accessToken(audience: String, roles: List<String>): String {
        val claims =
            jsonMapper.writeValueAsString(
                mapOf(
                    "aud" to listOf(audience),
                    "preferred_username" to "mcp.agent",
                    "realm_access" to mapOf("roles" to roles),
                ),
            )
        val authorizeUrl =
            "${oidcProvider.issuerUri()}/authorize?client_id=$CLIENT_ID" +
                "&response_type=code&scope=openid&state=mcp-it" +
                "&redirect_uri=${encode(REDIRECT_URI)}"

        val login =
            send(
                HttpRequest.newBuilder(URI.create(authorizeUrl))
                    .header("Content-Type", "application/x-www-form-urlencoded")
                    .POST(
                        HttpRequest.BodyPublishers.ofString(
                            "username=mcp-agent&claims=${encode(claims)}",
                        ),
                    )
                    .build(),
            )
        assertThat(login.statusCode()).isEqualTo(302)
        val callback = login.headers().firstValue("Location").orElseThrow()
        val code =
            UriComponentsBuilder.fromUriString(callback).build().queryParams.getFirst("code")
                ?: error("The provider did not return an authorization code: $callback")

        val tokenResponse =
            send(
                HttpRequest.newBuilder(URI.create("${oidcProvider.issuerUri()}/token"))
                    .header("Content-Type", "application/x-www-form-urlencoded")
                    .POST(
                        HttpRequest.BodyPublishers.ofString(
                            "grant_type=authorization_code&code=${encode(code)}" +
                                "&redirect_uri=${encode(REDIRECT_URI)}" +
                                "&client_id=$CLIENT_ID&client_secret=secret",
                        ),
                    )
                    .build(),
            )
        assertThat(tokenResponse.statusCode()).isEqualTo(200)
        val tokens = jsonMapper.readValue(tokenResponse.body(), Map::class.java)
        return tokens["access_token"] as? String
            ?: error("No access token in ${tokenResponse.body()}")
    }

    private fun send(request: HttpRequest): HttpResponse<String> =
        client.send(request, HttpResponse.BodyHandlers.ofString())

    private fun encode(value: String): String = URLEncoder.encode(value, StandardCharsets.UTF_8)

    private companion object {
        const val CLIENT_ID = "mcp-it"
        const val REDIRECT_URI = "http://127.0.0.1:33418/callback"
    }
}
