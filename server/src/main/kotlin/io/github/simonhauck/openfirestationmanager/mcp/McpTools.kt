package io.github.simonhauck.openfirestationmanager.mcp

import io.github.simonhauck.openfirestationmanager.clothing.item.ClothingItemLookupService
import io.github.simonhauck.openfirestationmanager.clothing.location.ClothingLocationService
import io.github.simonhauck.openfirestationmanager.clothing.type.ClothingTypeService
import io.github.simonhauck.openfirestationmanager.common.PublicApiException
import io.github.simonhauck.openfirestationmanager.member.MemberService
import io.github.simonhauck.openfirestationmanager.security.auth.CurrentUserProvider
import io.github.simonhauck.openfirestationmanager.usermanagement.UserRole
import org.springframework.stereotype.Component
import tools.jackson.databind.json.JsonMapper

/** A JSON-RPC `-32602 Invalid params` failure, e.g. a missing tool argument or unknown tool. */
class McpInvalidParamsException(message: String) : RuntimeException(message)

/** The arguments of one `tools/call` request. */
class McpToolArguments(private val arguments: Map<String, Any?>) {

    fun requireString(name: String): String {
        val value = arguments[name] as? String
        if (value.isNullOrBlank()) {
            throw McpInvalidParamsException("Argument '$name' is required and must not be blank")
        }
        return value
    }

    fun optionalInt(name: String, default: Int): Int {
        val value = arguments[name] ?: return default
        return (value as? Number)?.toInt()
            ?: throw McpInvalidParamsException("Argument '$name' must be an integer")
    }
}

/**
 * One read-only MCP tool. [requiredRoles] lists the OFSM roles of which the caller needs at least
 * one, mirroring the matching REST endpoint; [handler] calls the same service as that endpoint.
 */
class McpTool(
    val name: String,
    val title: String,
    val description: String,
    val inputSchema: Map<String, Any>,
    val requiredRoles: Set<UserRole>,
    val handler: (McpToolArguments) -> Any,
) {
    fun definition(): Map<String, Any> =
        mapOf(
            "name" to name,
            "title" to title,
            "description" to description,
            "inputSchema" to inputSchema,
            "annotations" to
                mapOf("readOnlyHint" to true, "destructiveHint" to false, "openWorldHint" to false),
        )
}

/**
 * The tools of the MCP endpoint. The initial set is a deliberate, read-only selection of lookups
 * (`docs/adr/0002-first-party-mcp-endpoint.md`); write tools are added in follow-ups.
 *
 * Tool names reuse the `operationId` of the matching REST endpoint, so agents that used the
 * contract-generated tools find the same names.
 */
@Component
class McpToolRegistry(
    clothingTypeService: ClothingTypeService,
    clothingLocationService: ClothingLocationService,
    clothingItemLookupService: ClothingItemLookupService,
    memberService: MemberService,
    private val currentUserProvider: CurrentUserProvider,
    private val jsonMapper: JsonMapper,
) {

    val tools: List<McpTool> =
        listOf(
            McpTool(
                name = "listClothingTypes",
                title = "List clothing types",
                description =
                    "Returns all garment categories (`Kleidungsart`) known to the station, such " +
                        "as `Einsatzjacke` or `Helm`. Start here to learn the valid type names " +
                        "and ids.",
                inputSchema = NO_ARGUMENTS,
                requiredRoles = ANY_OFSM_ROLE,
            ) {
                clothingTypeService.getAllTypes()
            },
            McpTool(
                name = "listClothingLocations",
                title = "List clothing locations",
                description =
                    "Returns all places garments can be kept (`Standort`): personal lockers, the " +
                        "shared pool and the laundry, including locations flagged " +
                        "`onlyVisibleForKleiderwart`.",
                inputSchema = NO_ARGUMENTS,
                requiredRoles = ANY_OFSM_ROLE,
            ) {
                clothingLocationService.getAllLocations()
            },
            McpTool(
                name = "getClothingItemByBarcode",
                title = "Look up a clothing item by barcode",
                description =
                    "Resolves a barcode (the station `Barcode` or the `Hersteller-Barcode`) to the " +
                        "item it identifies, with its clothing type and current location " +
                        "embedded. Callers without the `KLEIDERWART` role cannot resolve items " +
                        "held in locations flagged `onlyVisibleForKleiderwart`; for them such an " +
                        "item reads as not found.",
                inputSchema =
                    objectSchema(
                        properties =
                            mapOf(
                                "barcode" to
                                    mapOf(
                                        "type" to "string",
                                        "description" to "Barcode exactly as printed.",
                                    ),
                            ),
                        required = listOf("barcode"),
                    ),
                requiredRoles = ANY_OFSM_ROLE,
            ) { arguments ->
                clothingItemLookupService.findByBarcode(
                    arguments.requireString("barcode"),
                    isKleiderwart = isKleiderwart(),
                )
            },
            McpTool(
                name = "searchClothingItems",
                title = "Search clothing items",
                description =
                    "Free-text search across the clothing type name, the size and both barcodes, " +
                        "e.g. `Einsatzjacke 52`. Results embed the clothing type and current " +
                        "location. Callers without the `KLEIDERWART` role never see items held in " +
                        "locations flagged `onlyVisibleForKleiderwart`. At most 50 results are " +
                        "returned; narrow the query rather than raising the limit.",
                inputSchema =
                    objectSchema(
                        properties =
                            mapOf(
                                "query" to
                                    mapOf(
                                        "type" to "string",
                                        "description" to
                                            "Search term matched against type name, size and " +
                                                "either barcode.",
                                    ),
                                "limit" to
                                    mapOf(
                                        "type" to "integer",
                                        "description" to
                                            "Maximum number of results (default and cap: 50).",
                                        "minimum" to 1,
                                        "maximum" to SEARCH_LIMIT,
                                    ),
                            ),
                        required = listOf("query"),
                    ),
                requiredRoles = ANY_OFSM_ROLE,
            ) { arguments ->
                clothingItemLookupService.search(
                    arguments.requireString("query"),
                    arguments.optionalInt("limit", SEARCH_LIMIT),
                    isKleiderwart = isKleiderwart(),
                )
            },
            McpTool(
                name = "listMembers",
                title = "List members",
                description =
                    "Returns the roster of people in the brigade (`Mitglied`). A member is a " +
                        "person, not a login.",
                inputSchema = NO_ARGUMENTS,
                requiredRoles = ANY_OFSM_ROLE,
            ) {
                memberService.getAllMembers()
            },
        )

    private val toolsByName = tools.associateBy { it.name }

    /**
     * Runs [name] for the current caller. Failures the caller can act on (missing role, not found,
     * invalid value) become a tool result with `isError: true`, as the MCP spec asks.
     */
    fun call(name: String, arguments: McpToolArguments): Map<String, Any> {
        val tool = toolsByName[name] ?: throw McpInvalidParamsException("Unknown tool: $name")

        if (tool.requiredRoles.none { currentUserProvider.checkCurrentUserHasRole(it) }) {
            return errorResult(
                "Access denied: this tool requires one of the OFSM roles " +
                    tool.requiredRoles.joinToString { it.name },
            )
        }

        val result =
            try {
                tool.handler(arguments)
            } catch (exception: PublicApiException) {
                return errorResult(exception.publicMessage)
            } catch (exception: IllegalArgumentException) {
                return errorResult(exception.message ?: "Invalid argument")
            }
        return textResult(jsonMapper.writeValueAsString(result), isError = false)
    }

    private fun isKleiderwart(): Boolean =
        currentUserProvider.checkCurrentUserHasRole(UserRole.KLEIDERWART)

    private fun errorResult(message: String): Map<String, Any> = textResult(message, isError = true)

    private fun textResult(text: String, isError: Boolean): Map<String, Any> =
        mapOf("content" to listOf(mapOf("type" to "text", "text" to text)), "isError" to isError)

    private companion object {
        const val SEARCH_LIMIT = 50

        /** Every read endpoint under `/api` requires at least one OFSM role. */
        val ANY_OFSM_ROLE: Set<UserRole> = UserRole.entries.toSet()

        val NO_ARGUMENTS: Map<String, Any> = objectSchema(properties = emptyMap())

        fun objectSchema(
            properties: Map<String, Any>,
            required: List<String> = emptyList(),
        ): Map<String, Any> =
            buildMap {
                put("type", "object")
                put("properties", properties)
                if (required.isNotEmpty()) put("required", required)
                put("additionalProperties", false)
            }
    }
}
