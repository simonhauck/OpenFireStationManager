package io.github.simonhauck.openfirestationmanager.mcp

import com.fasterxml.jackson.annotation.JsonIgnoreProperties
import io.swagger.v3.oas.annotations.Hidden
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpMethod
import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import tools.jackson.databind.json.JsonMapper

/** One incoming JSON-RPC 2.0 message: a request, a notification (no `id`) or a response. */
@JsonIgnoreProperties(ignoreUnknown = true)
data class JsonRpcMessage(
    val jsonrpc: String? = null,
    val id: Any? = null,
    val method: String? = null,
    val params: Map<String, Any?>? = null,
)

/**
 * The MCP endpoint (Streamable HTTP transport, stateless): every JSON-RPC message is one `POST
 * /mcp`, answered with a single JSON response. There is no SSE stream and no `Mcp-Session-Id`;
 * every request carries its own bearer token (see [McpSecurityConfiguration]).
 *
 * Supported methods: `initialize`, `ping`, `tools/list`, `tools/call`. Notifications (such as
 * `notifications/initialized`) and client responses are acknowledged with `202 Accepted`.
 *
 * Not part of the REST API, so it is hidden from the OpenAPI contract.
 */
@Hidden
@RestController
@RequestMapping(McpPaths.ENDPOINT)
class McpController(private val toolRegistry: McpToolRegistry, private val jsonMapper: JsonMapper) {

    @PostMapping
    fun handle(@RequestBody(required = false) body: String?): ResponseEntity<String> {
        if (body.isNullOrBlank()) return error(null, PARSE_ERROR, "Empty request body")

        val tree =
            runCatching { jsonMapper.readTree(body) }.getOrNull()
                ?: return error(null, PARSE_ERROR, "Request body is not valid JSON")
        val message =
            runCatching { jsonMapper.convertValue(tree, JsonRpcMessage::class.java) }.getOrNull()
                ?: return error(
                    null,
                    INVALID_REQUEST,
                    "Expected a single JSON-RPC 2.0 message (batches are not supported)",
                )

        val method = message.method
        val id = message.id
        // Notifications and responses to server requests need no answer.
        if (method == null || id == null) return ResponseEntity.accepted().build()
        if (message.jsonrpc != JSON_RPC_VERSION) {
            return error(id, INVALID_REQUEST, "jsonrpc must be \"$JSON_RPC_VERSION\"")
        }

        val params = message.params.orEmpty()
        return try {
            when (method) {
                "initialize" -> result(id, initialize(params))
                "ping" -> result(id, emptyMap<String, Any>())
                "tools/list" ->
                    result(id, mapOf("tools" to toolRegistry.tools.map { it.definition() }))
                "tools/call" -> result(id, callTool(params))
                else -> error(id, METHOD_NOT_FOUND, "Method not found: $method")
            }
        } catch (exception: McpInvalidParamsException) {
            error(id, INVALID_PARAMS, exception.message ?: "Invalid params")
        }
    }

    /** The transport offers no server-initiated SSE stream and no sessions to delete. */
    @GetMapping fun openStream(): ResponseEntity<String> = methodNotAllowed()

    @DeleteMapping fun deleteSession(): ResponseEntity<String> = methodNotAllowed()

    private fun initialize(params: Map<String, Any?>): Map<String, Any> {
        val requested = params["protocolVersion"] as? String
        val protocolVersion =
            requested?.takeIf { it in SUPPORTED_PROTOCOL_VERSIONS }
                ?: SUPPORTED_PROTOCOL_VERSIONS.first()
        return mapOf(
            "protocolVersion" to protocolVersion,
            "capabilities" to mapOf("tools" to mapOf("listChanged" to false)),
            "serverInfo" to
                mapOf(
                    "name" to SERVER_NAME,
                    "title" to ProtectedResourceMetadataController.RESOURCE_NAME,
                    "version" to (javaClass.`package`?.implementationVersion ?: "dev"),
                ),
            "instructions" to INSTRUCTIONS,
        )
    }

    private fun callTool(params: Map<String, Any?>): Map<String, Any> {
        val name = params["name"] as? String ?: throw McpInvalidParamsException("Missing tool name")
        val rawArguments = params["arguments"] ?: emptyMap<String, Any?>()
        val arguments =
            (rawArguments as? Map<*, *>)?.entries?.associate { (key, value) ->
                key.toString() to value
            } ?: throw McpInvalidParamsException("Tool arguments must be an object")
        return toolRegistry.call(name, McpToolArguments(arguments))
    }

    private fun result(id: Any, result: Any): ResponseEntity<String> =
        json(mapOf("jsonrpc" to JSON_RPC_VERSION, "id" to id, "result" to result))

    private fun error(id: Any?, code: Int, message: String): ResponseEntity<String> =
        json(
            mapOf(
                "jsonrpc" to JSON_RPC_VERSION,
                "id" to id,
                "error" to mapOf("code" to code, "message" to message),
            ),
        )

    private fun json(body: Map<String, Any?>): ResponseEntity<String> =
        ResponseEntity.ok()
            .contentType(MediaType.APPLICATION_JSON)
            .body(jsonMapper.writeValueAsString(body))

    private fun methodNotAllowed(): ResponseEntity<String> =
        ResponseEntity.status(HttpStatus.METHOD_NOT_ALLOWED)
            .header(HttpHeaders.ALLOW, HttpMethod.POST.name())
            .build()

    private companion object {
        const val JSON_RPC_VERSION = "2.0"
        const val SERVER_NAME = "ofsm"

        const val PARSE_ERROR = -32700
        const val INVALID_REQUEST = -32600
        const val METHOD_NOT_FOUND = -32601
        const val INVALID_PARAMS = -32602

        /** Newest first; an unknown requested version is answered with the newest. */
        val SUPPORTED_PROTOCOL_VERSIONS = listOf("2025-11-25", "2025-06-18", "2025-03-26")

        const val INSTRUCTIONS =
            "Read-only access to the clothing store (Kleiderkammer) of a fire station: clothing " +
                "types, locations, items (by barcode or free-text search) and members. Every " +
                "call acts with the OFSM roles of the signed-in user."
    }
}
