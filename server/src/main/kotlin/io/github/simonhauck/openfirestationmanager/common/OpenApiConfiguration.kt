package io.github.simonhauck.openfirestationmanager.common

import io.github.simonhauck.openfirestationmanager.security.config.RememberMeProperties
import io.swagger.v3.core.converter.ModelConverters
import io.swagger.v3.oas.models.Components
import io.swagger.v3.oas.models.OpenAPI
import io.swagger.v3.oas.models.Operation
import io.swagger.v3.oas.models.info.Contact
import io.swagger.v3.oas.models.info.Info
import io.swagger.v3.oas.models.media.Content
import io.swagger.v3.oas.models.media.MediaType
import io.swagger.v3.oas.models.media.Schema
import io.swagger.v3.oas.models.responses.ApiResponse
import io.swagger.v3.oas.models.responses.ApiResponses
import io.swagger.v3.oas.models.security.SecurityRequirement
import io.swagger.v3.oas.models.security.SecurityScheme
import io.swagger.v3.oas.models.tags.Tag
import jakarta.validation.Valid
import org.springdoc.core.customizers.OperationCustomizer
import org.springframework.beans.factory.annotation.Value
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.core.annotation.AnnotatedElementUtils
import org.springframework.http.ProblemDetail
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.method.HandlerMethod

/**
 * Names of the OpenAPI tags used across all controllers.
 *
 * Tags are the filtering surface for API consumers — most importantly for MCP servers, which use
 * `--tag` / `--exclude-tag` to decide which operations become callable tools. Keep them stable:
 * renaming a tag silently changes what an MCP client exposes.
 */
object ApiTags {
    const val CLOTHING_ITEMS = "Clothing Items"
    const val CLOTHING_TYPES = "Clothing Types"
    const val CLOTHING_LOCATIONS = "Clothing Locations"
    const val CLOTHING_CHECKOUT = "Clothing Checkout"
    const val CLOTHING_RELOCATION = "Clothing Relocation"
    const val CLOTHING_INVENTORY = "Clothing Inventory"
    const val CLOTHING_OVERVIEW = "Clothing Overview"
    const val MEMBERS = "Members"
    const val AUTHENTICATION = "Authentication"
    const val SETUP = "Setup"
    const val ADMIN_USERS = "Admin - Users"
    const val ADMIN_LEGAL = "Admin - Legal"
    const val LEGAL = "Legal"

    /** Name of the session cookie carrying the authenticated session. */
    const val SESSION_COOKIE_SCHEME = "sessionCookie"

    /** Name of the remember-me cookie issued when a login requests persistence. */
    const val REMEMBER_ME_COOKIE_SCHEME = "rememberMeCookie"
}

private fun buildApiDescription(
    sessionCookieName: String,
    rememberMeCookieName: String,
    rememberMeValidity: String,
) =
    """
    REST API for **OpenFireStationManager**, an open-source platform for managing a volunteer fire
    station. The current scope is **protective clothing management** (German: *Kleiderverwaltung*):
    tracking individual garments, where they are stored, and who has taken them out.

    ## Domain model

    The clothing domain is built from four concepts:

    - **Clothing Type** (*Kleidungsart*) — a category of garment, e.g. "Einsatzjacke", "Helm".
      Types have a name only; they carry no size or count of their own.
    - **Clothing Item** (*Kleidungsstück*, colloquially *Klamotte*) — one physical garment. It has a
      type, a size, an optional barcode, and an optional current location. An item with no location
      is considered unassigned.
    - **Clothing Location** (*Standort*) — anywhere an item can be. Each location has a `type`:
      `POOL` (shared stock available to everyone), `WAESCHE` (at the laundry), `PERSONAL`
      (assigned to one member, e.g. a named locker), or `OTHER`. Locations flagged
      `onlyVisibleForKleiderwart` are hidden from ordinary users in lookup and search results.
    - **Clothing Movement** — an append-only log entry recording that an item moved from one
      location to another, with a reason. Movements are never written directly; they are a
      side effect of checkout, relocation, and inventory reconciliation.

    Operations that move several items at once return a `batchId`. All movements produced by a
    single request share that id, which is what makes a bulk action auditable and reversible.

    ## Roles

    Three roles exist, and they are cumulative rather than exclusive:

    - `USER` — may read clothing data and perform checkouts and returns for themselves.
    - `KLEIDERWART` (*quartermaster*) — additionally may create, update, and delete clothing types,
      items, and locations, and may run relocations and inventory reconciliation.
    - `ADMIN` — implicitly holds every other role, and additionally manages user accounts and the
      legal documents (Impressum, privacy policy).

    Because `ADMIN` implies `KLEIDERWART`, an admin account can call every endpoint in this API.

    ## Authentication

    Authentication is **cookie-based**, not token-based. Call `POST /api/public/auth/login`; on
    success the server sets a `$sessionCookieName` session cookie, plus a `$rememberMeCookieName`
    cookie when `rememberMe` is `true`. Send the cookie on every subsequent request. There is no
    `Authorization` header and no bearer token.

    The remember-me cookie authenticates on its own and is valid for $rememberMeValidity, so a
    long-lived client can log in once and keep using it rather than holding a session open.

    Endpoints under `/api/public/**` need no authentication. Everything else under `/api/**`
    requires a valid session; `/api/admin/**` additionally requires the `ADMIN` role.

    ## Error format

    All errors return [RFC 9457](https://www.rfc-editor.org/rfc/rfc9457) `application/problem+json`.
    Request-body validation failures (`400`) additionally carry an `errors` array naming each
    offending field, its message, and the value that was rejected.
    """
        .trimIndent()

/**
 * Central OpenAPI document metadata.
 *
 * SpringDoc derives paths and schemas from the controllers; everything that cannot be inferred from
 * code — the description above, the tag list, and the cookie security schemes — is declared here so
 * there is exactly one place to change it.
 */
@Configuration
class OpenApiConfiguration(
    private val rememberMeProperties: RememberMeProperties,
    @param:Value("\${server.servlet.session.cookie.name}") private val sessionCookieName: String,
) {

    @Bean
    fun openApiDefinition(): OpenAPI =
        OpenAPI()
            .info(
                Info()
                    .title("OpenFireStationManager API")
                    .version("v1")
                    .description(apiDescription())
                    .contact(
                        Contact()
                            .name("OpenFireStationManager")
                            .url("https://github.com/simonhauck/OpenFireStationManager")
                    )
            )
            .components(
                Components()
                    .also { components ->
                        // The customizer below references these by $ref, so they must exist even
                        // when no controller mentions them explicitly.
                        errorSchemas().forEach { (name, schema) ->
                            components.addSchemas(name, schema)
                        }
                    }
                    .addSecuritySchemes(
                        ApiTags.SESSION_COOKIE_SCHEME,
                        SecurityScheme()
                            .type(SecurityScheme.Type.APIKEY)
                            .`in`(SecurityScheme.In.COOKIE)
                            .name(sessionCookieName)
                            .description(
                                "Server-side session cookie issued by `POST /api/public/auth/login`. " +
                                    "Send it on every authenticated request."
                            ),
                    )
                    .addSecuritySchemes(
                        ApiTags.REMEMBER_ME_COOKIE_SCHEME,
                        SecurityScheme()
                            .type(SecurityScheme.Type.APIKEY)
                            .`in`(SecurityScheme.In.COOKIE)
                            .name(rememberMeProperties.tokenName)
                            .description(
                                "Long-lived cookie issued when logging in with `rememberMe = true`, " +
                                    "valid for ${humanValidity()}. It authenticates on its own, so a " +
                                    "long-lived client may send it instead of a session cookie."
                            ),
                    )
            )
            .addSecurityItem(SecurityRequirement().addList(ApiTags.SESSION_COOKIE_SCHEME))
            .tags(
                listOf(
                    Tag()
                        .name(ApiTags.AUTHENTICATION)
                        .description(
                            "Log in, log out, and inspect the current session. Public — no session required."
                        ),
                    Tag()
                        .name(ApiTags.SETUP)
                        .description(
                            "One-time bootstrap of the first administrator. Only usable while no user account exists."
                        ),
                    Tag()
                        .name(ApiTags.CLOTHING_TYPES)
                        .description(
                            "Categories of garment (*Kleidungsart*), e.g. \"Einsatzjacke\". Reading is open to any " +
                                "signed-in user; writing requires the KLEIDERWART role."
                        ),
                    Tag()
                        .name(ApiTags.CLOTHING_LOCATIONS)
                        .description(
                            "Places where garments are stored (*Standort*) — shared pool, laundry, personal lockers. " +
                                "Reading is open to any signed-in user; writing requires the KLEIDERWART role."
                        ),
                    Tag()
                        .name(ApiTags.CLOTHING_ITEMS)
                        .description(
                            "Individual physical garments (*Kleidungsstück*), including barcode lookup and search. " +
                                "Reading is open to any signed-in user; writing requires the KLEIDERWART role."
                        ),
                    Tag()
                        .name(ApiTags.CLOTHING_CHECKOUT)
                        .description(
                            "Taking garments out and returning them. Available to any signed-in user."
                        ),
                    Tag()
                        .name(ApiTags.CLOTHING_RELOCATION)
                        .description(
                            "Bulk-moving garments between locations (*Umlagerung*). Requires the KLEIDERWART role."
                        ),
                    Tag()
                        .name(ApiTags.CLOTHING_INVENTORY)
                        .description(
                            "Stock-taking against a single location (*Inventarisierung*): preview the difference, " +
                                "then commit it. Requires the KLEIDERWART role."
                        ),
                    Tag()
                        .name(ApiTags.CLOTHING_OVERVIEW)
                        .description(
                            "Read-only aggregated counts of garments by type and by location, for dashboards."
                        ),
                    Tag()
                        .name(ApiTags.MEMBERS)
                        .description(
                            "People in the organisation (*Mitglied*) — the roster of who is in the " +
                                "brigade. Deliberately separate from user accounts: a member is a " +
                                "person, an account is a login, and the two are not linked. " +
                                "Requires the KLEIDERWART role to modify."
                        ),
                    Tag()
                        .name(ApiTags.LEGAL)
                        .description(
                            "Publicly readable legal documents: Impressum and privacy policy."
                        ),
                    Tag()
                        .name(ApiTags.ADMIN_USERS)
                        .description(
                            "User account administration. Requires the ADMIN role. " +
                                "Exclude this tag to keep account management out of automated tool surfaces."
                        ),
                    Tag()
                        .name(ApiTags.ADMIN_LEGAL)
                        .description(
                            "Maintaining the Impressum and privacy policy documents. Requires the ADMIN role. " +
                                "Exclude this tag to keep legal-document mutation out of automated tool surfaces."
                        ),
                )
            )

    /**
     * Adds the error responses that every endpoint shares, and states the required role in prose.
     *
     * These facts are derived from the code itself — the URL namespace and the `@PreAuthorize`
     * expression — rather than repeated by hand on 46 operations. That keeps the documented
     * authorisation rules incapable of drifting away from the enforced ones, and keeps the
     * controllers readable by leaving only the responses that carry real meaning.
     */
    @Bean
    fun commonResponsesCustomizer(): OperationCustomizer =
        OperationCustomizer { operation, handlerMethod ->
            val isPublic = fullPathsOf(handlerMethod).any(::isPublicPath)
            val requiredRole = requiredRoleOf(handlerMethod)

            appendRoleToDescription(operation, requiredRole, isPublic)
            addCommonErrorResponses(operation, isPublic, hasRoleRestriction = requiredRole != null)
            addValidationResponse(operation, handlerMethod)

            // Public endpoints must opt out of the document-level session-cookie requirement.
            if (isPublic) operation.security = emptyList()

            operation
        }

    private fun appendRoleToDescription(
        operation: Operation,
        requiredRole: String?,
        isPublic: Boolean,
    ) {
        val note =
            when {
                isPublic -> "**Authentication:** none — this endpoint is public."
                requiredRole != null ->
                    "**Authorisation:** requires the `$requiredRole` role. " +
                        "An `ADMIN` account implicitly holds every role and may also call this."
                else -> "**Authorisation:** any signed-in user."
            }

        operation.description =
            listOfNotNull(operation.description?.takeIf { it.isNotBlank() }, note)
                .joinToString("\n\n")
    }

    private fun addCommonErrorResponses(
        operation: Operation,
        isPublic: Boolean,
        hasRoleRestriction: Boolean,
    ) {
        val responses = operation.responses ?: ApiResponses().also { operation.responses = it }

        if (!isPublic) {
            responses.putIfAbsent(
                "401",
                problemResponse("Not authenticated — no valid session cookie was supplied."),
            )
        }
        if (hasRoleRestriction) {
            responses.putIfAbsent(
                "403",
                problemResponse("Authenticated, but the account lacks the required role."),
            )
        }
        responses.putIfAbsent(
            "500",
            problemResponse("Unexpected server error. The response body carries no details."),
        )
    }

    private fun addValidationResponse(operation: Operation, handlerMethod: HandlerMethod) {
        val validatesInput =
            handlerMethod.methodParameters.any {
                it.hasParameterAnnotation(Valid::class.java)
            } || handlerMethod.method.parameterCount > 0

        if (!validatesInput) return

        operation.responses?.putIfAbsent(
            "400",
            ApiResponse()
                .description(
                    "The request failed validation. The `errors` array names each offending field."
                )
                .content(
                    Content()
                        .addMediaType(
                            PROBLEM_JSON,
                            MediaType()
                                .schema(
                                    Schema<Any>()
                                        .`$ref`("#/components/schemas/ValidationProblemDetail")
                                ),
                        )
                ),
        )
    }

    private fun problemResponse(description: String): ApiResponse =
        ApiResponse()
            .description(description)
            .content(
                Content()
                    .addMediaType(
                        PROBLEM_JSON,
                        MediaType()
                            .schema(Schema<Any>().`$ref`("#/components/schemas/ProblemDetail")),
                    )
            )

    /** Resolves the `hasRole('ROLE_X')` expression on a handler into the bare role name. */
    private fun requiredRoleOf(handlerMethod: HandlerMethod): String? {
        val expression =
            AnnotatedElementUtils.findMergedAnnotation(
                    handlerMethod.method,
                    PreAuthorize::class.java,
                )
                ?.value ?: return null
        return ROLE_EXPRESSION.find(expression)?.groupValues?.get(1)?.removePrefix("ROLE_")
    }

    /**
     * Rebuilds the full request paths of a handler by combining class- and method-level mappings.
     */
    private fun fullPathsOf(handlerMethod: HandlerMethod): List<String> {
        val classPaths = mappingPaths(handlerMethod.beanType)
        val methodPaths = mappingPaths(handlerMethod.method)

        if (classPaths.isEmpty()) return methodPaths.ifEmpty { listOf("/") }
        if (methodPaths.isEmpty()) return classPaths
        return classPaths.flatMap { prefix -> methodPaths.map { suffix -> prefix + suffix } }
    }

    private fun mappingPaths(element: java.lang.reflect.AnnotatedElement): List<String> =
        AnnotatedElementUtils.findMergedAnnotation(element, RequestMapping::class.java)
            ?.let { it.path.toList().ifEmpty { it.value.toList() } }
            ?.filter { it.isNotBlank() } ?: emptyList()

    private fun isPublicPath(path: String): Boolean =
        path.startsWith("/api/public/") || path == "/privacy-policy"

    /**
     * Builds the document description with the cookie names this instance actually issues.
     *
     * Both names are configurable, so interpolating them keeps the documentation correct rather
     * than repeating a literal that can quietly go stale.
     */
    private fun apiDescription(): String =
        buildApiDescription(
            sessionCookieName = sessionCookieName,
            rememberMeCookieName = rememberMeProperties.tokenName,
            rememberMeValidity = humanValidity(),
        )

    private fun humanValidity(): String {
        val days = rememberMeProperties.tokenValidity.toDays()
        return if (days > 0) "$days days"
        else "${rememberMeProperties.tokenValidity.toHours()} hours"
    }

    /** Resolves the shared error payload schemas so the customizer's `$ref`s always resolve. */
    private fun errorSchemas(): Map<String, Schema<*>> =
        ModelConverters.getInstance().let { converter ->
            converter.readAll(ProblemDetail::class.java) +
                converter.readAll(ValidationProblemDetail::class.java)
        }

    private companion object {
        const val PROBLEM_JSON = "application/problem+json"
        val ROLE_EXPRESSION = Regex("""hasRole\(\s*'([^']+)'\s*\)""")
    }
}
