
# AGENTS.md — server

Guidance for agentic coding assistants working in the `server/` component.

> For monorepo-level context (project overview, formatting ownership, CI/CD status) see the
> root `AGENTS.md`.

---

## Overview

Spring Boot 4 + Kotlin backend that serves the OpenFireStationManager REST API. Uses Spring Data
JDBC for persistence, PostgreSQL as the database, and SpringDoc OpenAPI for API documentation.

**Tech stack:**

- Kotlin 2.2.21, Java 24
- Spring Boot 4.0.3 (Spring MVC, Spring Data JDBC, Spring Validation)
- PostgreSQL (via Testcontainers in tests; provide via env vars `DB_URL`, `DB_USERNAME`, `DB_PASSWORD` for local dev)
- SpringDoc OpenAPI 3.0.2 — Swagger UI at `/swagger-ui.html`, schema at `/schema.json`
- Jackson + `jackson-module-kotlin`
- Gradle 9.3.1 (Kotlin DSL, `build.gradle.kts`)

### Core Auth/Config Conventions

- Put **all custom application properties** under the `app.*` root key in `application.yml`.
- Treat `/api/public/**` as unauthenticated routes (publicly accessible).
- Keep all endpoints under the `/api/**` namespace.
- Use `/api/admin/**` for admin-only endpoints.
- Keep protected API routes outside `/api/public/**` unless there is an explicit exception.
- Authentication is delegated to an OpenID Connect provider (`spring.security.oauth2.client.*`, registration `ofsm`); the server keeps the result in a server-side session (`OFSM_AUTH` cookie). Sessions are persisted in PostgreSQL with Spring Session JDBC (tables `SPRING_SESSION*` from migration V026, `spring.session.jdbc.initialize-schema: never`; cleanup cron via `SESSION_CLEANUP_CRON`), so restarts do not sign anyone out; anything stored in the session must be `Serializable`. Cookie settings and timeout still come from `server.servlet.session.*`. The frontend uses cookie credentials, not browser token storage.
- Roles come from the provider claims listed in `app.auth.roles.claim-paths` (default `realm_access.roles`), mapped to OFSM roles through `app.auth.roles.mapping` (see `docs/role-mapping.md`); `ADMIN` implies every role. Everything under `/api/**` except `/api/public/**` and `/api/test/**` requires at least one OFSM role (users without one get `403`; `/me` still reports `roles: []`). Integration tests get sessions from the test-only `POST /api/test/session` endpoint; `OidcLoginIT` drives the real flow against `navikt/mock-oauth2-server`.
- `/mcp` (and `/.well-known/oauth-protected-resource/**`) has its own stateless filter chain (`mcp/McpSecurityConfiguration`): bearer access tokens from the same issuer, `aud` checked against `app.auth.mcp.accepted-audiences`, roles from the access token through the same `RoleMapper`, no session and no cookie. See "Consuming the API over MCP" below.

All commands below are run from the repository root using the Gradle wrapper — there is no
`gradlew` inside `server/`. Prefix tasks with `:server:` to scope them to this component.

---

## Commands

|            Purpose             |                    Command                    |
|--------------------------------|-----------------------------------------------|
| Update API definition (schema) | `./update-api-definition.sh` (from repo root) |

> **After any API change**, run `./update-api-definition.sh` from the repo root. It regenerates
> the OpenAPI schema (`schema.json`) by running `HttpApiContractIT` with `UPDATE_SNAPSHOT=true`,
> then applies Spotless formatting in a separate step to avoid a race condition.
>
> Then regenerate the frontend bindings with `npm run prepareEnv` from `client/`. CI checks the
> contract against the running server, but **nothing** checks `client/src/api/schema.ts` against
> the contract, so a stale binding will pass CI unnoticed.

| Build (compile + test + JAR) | `./gradlew :server:build` |
| Run application | `./gradlew :server:bootRun` |
| Run all tests | `./gradlew :server:test` |
| Run a single test class | `./gradlew :server:test --tests "io.github.simonhauck.openfirestationmanager.MyTest"` |
| Run a single test method | `./gradlew :server:test --tests "io.github.simonhauck.openfirestationmanager.MyTest.myMethod"` |
| Run tests with verbose output | `./gradlew :server:test --info` |
| Clean build artifacts | `./gradlew :server:clean` |

---

## Testing

Tests use **JUnit 5** via `useJUnitPlatform()`. **Docker must be running** before executing
integration tests — `IntegrationTest` uses Testcontainers to automatically start a PostgreSQL
container.

**Base classes:**

- Extend `IntegrationTest` for tests that need a running application context and database.
- Use plain JUnit 5 (no base class) for pure unit tests that don't need Spring context.

**Patterns:**

- Name test classes with a `Test` or `Tests` suffix.
- If a test class extends `IntegrationTest`, use the `IT` suffix (for example `AuthIT`,
  `OidcLoginIT`) instead of `IntegrationTest` in the class name.
- One `@Test` method per behaviour.
- Prefer backtick test names for longer/descriptive Kotlin test cases, for example
  ``fun `should generate valid jwt token`()``.
- For short/simple cases, regular camelCase names are fine (`contextLoads`, `shouldReturn404WhenNotFound`).
- Prefer AssertJ assertions (`assertThat(...)`) in tests for readability and fluent checks.
- Prefer `@Test` + assertions over `@ParameterizedTest` unless testing multiple inputs of the
  same behaviour.
- **Do not** add "returns 403 when no auth cookie is provided" tests to every controller IT class.
  Authentication is a cross-cutting concern covered centrally; only test it once (e.g. in `AuthControllerIT`).
- **Do not** add validation error tests (e.g. "returns 400 when parameter is invalid") unless
  explicitly requested. Validation behaviour is covered generically; only test it when the feature
  has specific validation logic worth verifying.
- **Do not** add "returns 404 when resource does not exist" tests unless explicitly requested.
  This error handling is generic and covered centrally.
- **Focus on happy-path tests only.** Write exactly one test per endpoint covering the successful
  case. Do not add additional tests (error cases, edge cases, alternate inputs) unless explicitly
  asked.

---

## Package Structure

```
src/
├── main/kotlin/io/github/simonhauck/openfirestationmanager/
│   └── OpenFireStationManagerApplication.kt   ← entry point
├── main/resources/
│   └── application.yml                        ← Spring config
└── test/kotlin/io/github/simonhauck/openfirestationmanager/
    ├── IntegrationTest.kt                     ← base class for integration tests
    └── OpenFireStationManagerApplicationTests.kt
```

Place new source files under `io.github.simonhauck.openfirestationmanager` and organise by feature
sub-package (e.g. `.station`, `.vehicle`, `.incident`) rather than by layer.

---

## Code Style

Spotless is configured to format Kotlin code with `ktfmt`. Follow standard IntelliJ/Kotlin defaults for code structure, and use Spotless as the source of truth for final formatting.

### Formatting

- 4-space indentation, no tabs.
- Max line length: ~120 characters (IntelliJ default).
- Opening braces on the same line; no blank line after class/function opening brace.
- Trailing commas in multi-line argument/parameter lists.

### Naming Conventions

|            Element             |        Convention         |                        Example                        |
|--------------------------------|---------------------------|-------------------------------------------------------|
| Classes / objects / interfaces | `PascalCase`              | `StationController`                                   |
| Functions and properties       | `camelCase`               | `findById`                                            |
| Local variables                | `camelCase`               | `stationId`                                           |
| Top-level constants            | `SCREAMING_SNAKE_CASE`    | `DEFAULT_PAGE_SIZE`                                   |
| Packages                       | lowercase, reverse-domain | `io.github.simonhauck.openfirestationmanager.station` |
| Test classes                   | suffix `Test` or `Tests`  | `StationServiceTests`                                 |

### Kotlin Specifics

- **`-Xjsr305=strict` is active** — Spring `@Nullable`/`@NonNull` annotations are enforced as
  Kotlin null-safety constraints. Respect them; never suppress with `@Suppress`.
- **`-Xannotation-default-target=param-property`** — Spring validation annotations (e.g.
  `@NotBlank`) on constructor parameters apply to both the field and the constructor parameter,
  so you don't need explicit `@field:` use-site targets.
- Use Kotlin **data classes** for DTOs and value objects.
- Keep related small model types together in one file (for example when one model directly uses another).
- Prefer `val` over `var`; use immutable collections (`listOf`, `mapOf`) where possible.
- **Avoid `!!`** (non-null assertion); use `?.let { }`, `?: error("…")`, or safe casts instead.
- Prefer `require()` / `check()` / `error()` for precondition and invariant failures.
- For Spring Data JDBC entities, use non-null IDs with `0` as default for new records (e.g. `@Id val id: Long = 0`).

### Imports

Follow standard Kotlin import ordering (IDE-managed):

1. `java.*` / `javax.*`
2. `kotlin.*`
3. Third-party libraries (Spring, Jackson, etc.)
4. Project-internal packages (`io.github.simonhauck.openfirestationmanager.*`)

Remove unused imports before committing. Do not use wildcard imports (`import foo.*`).

### Error Handling

- Throw specific exception types; never catch `Exception` or `Throwable` broadly.
- Prefer guard clauses (early returns) to avoid deeply nested conditionals.
- Prefer `runCatching` when converting library parsing/validation failures into explicit result
  values (for example auth token parsing), and return early on failure.
- Use `@ControllerAdvice` + `@ExceptionHandler` to map domain exceptions to HTTP responses;
  do not let exceptions bubble up to Spring's default handler.
- Return structured error bodies (e.g. a `ProblemDetail` or custom error DTO) consistently.
- In service/domain code, use `require()` for argument validation and `check()` for state
  invariants; these throw `IllegalArgumentException` / `IllegalStateException` respectively.

---

## API Design

- All REST endpoints **must** be documented with SpringDoc annotations so they appear correctly in
  `/schema.json`. Every operation needs:
  - `@Tag(name = ApiTags.X)` on the controller class, using a constant from
    `common/OpenApiConfiguration.kt` — never a bare string, and never the SpringDoc default
    (which is the kebab-cased class name). Introducing a new feature area means **two** edits in
    that file: add the `ApiTags` constant *and* register a `Tag()` with a description in the
    `.tags(...)` list. A constant without a registered description yields an undescribed tag.
  - `@Operation(operationId = …, summary = …, description = …)`. **All three are required.**
    The `operationId` must be unique across the whole API; use `verb + Resource` in camelCase
    (`listClothingItems`, `deleteClothingType`). The `description` should state what the endpoint
    does, when to prefer a sibling endpoint, and any non-obvious consequence.
  - `@ApiResponse` for the success status and for every **domain-specific** failure (`404`,
    `409`, `422`, and any `400` with a meaning beyond schema validation).
  - `@Parameter(description = …, example = …)` on every path variable and request parameter.
- Keep `operationId` stable when practical, but rename it deliberately when a clearer name is
  worth it. The TypeScript bindings key off paths rather than ids, and MCP tools are defined in
  code rather than generated from the contract (`docs/adr/0002`), so a rename breaks nothing in
  this repo — but nothing will warn you either.
- Do **not** hand-write `401`, `403`, `500`, or generic `400` responses, and do not hand-write the
  required-role prose. `OpenApiConfiguration.commonResponsesCustomizer` derives all of them from
  the URL namespace and the `@PreAuthorize` expression, so they cannot drift from what is
  actually enforced. Adding them by hand produces duplicates.
- Annotate DTO and entity properties with `@field:Schema(description = …, example = …)`. These
  descriptions are the contract's documentation; an undocumented field is an unusable one. Use
  `@get:Schema` instead for computed properties declared in the class body
  (for example the `totalCount` values in `ClothingOverview.kt`), where there is no constructor
  parameter to annotate.
- Model an absent value as **optional**, never as nullable-and-optional. Declare a nullable Kotlin
  property with a default (e.g. `val memberId: AggregateReference<Member, Long>? = null`), annotate
  it with `@field:Schema(implementation = Long::class, …)` **only**, and leave it out of the
  OpenAPI `required` list (SpringDoc does this automatically for a property with a default). Do
  **not** add `types = ["integer", "null"]` or any equivalent null type: that makes the generated
  TypeScript both optional and nullable, forcing every caller to handle two spellings of "absent".
  The generated type must be optional-only (`memberId?: number`), matching
  `ClothingItem.locationId` and `.barcode`. Omitting the field and sending `null` are equivalent
  on the wire, which is what the full-replacement `PATCH` endpoints rely on. See
  `server/docs/adr/0009-nullable-field-representation-in-openapi.md`.
- Prefer interpolating a configured value over restating it. `OpenApiConfiguration` injects the
  cookie name and session timeout rather than hardcoding them, so the documentation cannot
  contradict `application.yml`. Apply the same instinct to any other configurable fact.

### Test-profile seeding controllers

Test-only seeding endpoints under `/api/test/**` are gated by `app.testing.enabled` and exist
only to create E2E fixtures. They **are part of the committed OpenAPI contract** (the contract
integration test boots with the test profile), so they are subject to every SpringDoc rule
above: a `@Tag(name = ApiTags.TEST)` on the controller, `@Operation` with all three fields, and
`@Schema` on every DTO property. They call domain services with the same production DTOs the
real endpoints use, so the seeded data behaves exactly like data created through the UI.

### Worked example

Copy this shape rather than inventing a new one. Note that `401`, `403`, and `500` are absent
deliberately — the customizer adds them.

```kotlin
@RestController
@RequestMapping("/api/clothing/types")
@Validated
@Tag(name = ApiTags.CLOTHING_TYPES)
class ClothingTypeController(private val service: ClothingTypeService) {

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(
        operationId = "deleteClothingType",
        summary = "Delete a clothing type",
        description =
            "Removes a garment category. This is only possible once no clothing item references " +
                "the type any more — the request is refused with `409 Conflict` otherwise, rather " +
                "than cascading. Delete or re-type the remaining items first.",
    )
    @ApiResponses(
        ApiResponse(responseCode = "204", description = "The type was deleted."),
        ApiResponse(
            responseCode = "409",
            description = "Clothing items still reference this type. Nothing was deleted.",
            content = [
                Content(
                    mediaType = "application/problem+json",
                    schema = Schema(implementation = ProblemDetail::class),
                )
            ],
        ),
    )
    @PreAuthorize("hasRole('ROLE_KLEIDERWART')")
    fun deleteType(
        @Parameter(description = "Numeric id of the clothing type to delete.", example = "3")
        @PathVariable
        @Positive
        id: Long,
    ) {
        service.deleteType(id)
    }
}
```

### Conventions

- Follow RESTful conventions:
  - Resource-oriented URLs: `/api/stations`, `/api/stations/{id}`
  - Use appropriate HTTP verbs: `GET` (read), `POST` (create), `PUT`/`PATCH` (update), `DELETE`
  - Creation endpoints return `200 OK` with the created entity as the response body. `201 Created`
    and the `Location` header are deliberately **not** used for CRUD resources — every client is the
    generated TypeScript binding, which reads the id from the body. Follow the existing CRUD
    controllers (`ClothingLocationController`, `ClothingTypeController`, `ClothingItemController`,
    `MemberController`) rather than generic REST advice here. The one exception is
    `PrivacyPolicyAdminController`'s multipart upload, which returns `201` because it replaces a
    stored document rather than creating an addressable resource.
  - Return `404 Not Found` for missing resources. Where a resource is optional and may legitimately
    be absent (Impressum, privacy policy), still return `404` and provide a companion
    `/exists` endpoint — do **not** return `200` with a null body, which makes the response schema
    nullable and awkward for every generated client.
  - Return `400 Bad Request` for validation errors. `422 Unprocessable Entity` is reserved for
    semantically valid requests the server refuses on content grounds, and is currently used only
    for an unsupported privacy-policy file type.
  - Return `204 No Content` from `DELETE` via `@ResponseStatus(HttpStatus.NO_CONTENT)`.
- Public endpoints should be namespaced under `/api/public/**`.
- Validate all request bodies and path variables with Spring Validation annotations; the
  `@ControllerAdvice` translates `MethodArgumentNotValidException` (body),
  `ConstraintViolationException` (params on `@Validated` classes), and
  `HandlerMethodValidationException` into `400` responses carrying an `errors` array.
- Annotate nested collections with `@field:Valid` (and usually `@field:NotEmpty`). Without
  `@field:Valid`, per-element constraints on a `List<SomeDto>` are silently **not** enforced.
- Use Kotlin data classes as request/response DTOs; keep them separate from domain/entity classes.

---

## Consuming the API over MCP

The server hosts its own MCP endpoint at `/mcp` (package `mcp`, decision in root
`docs/adr/0002`). Coding agents connect to the URL and sign the developer in through the OpenID
Connect provider in the browser, following the MCP authorization spec. Nothing is copied by hand.

**Transport.** Streamable HTTP, stateless: every JSON-RPC message is one `POST /mcp` answered with
one JSON response (`McpController`). Supported methods are `initialize`, `ping`, `tools/list` and
`tools/call`; notifications get `202`. There is no SSE stream and no `Mcp-Session-Id`, so
`GET`/`DELETE /mcp` return `405`. `/mcp` is hidden from the OpenAPI contract.

**Authentication.** `/mcp` is an OAuth2 resource server with its own filter chain
(`McpSecurityConfiguration`), separate from the cookie-based browser chain:

- It accepts `Authorization: Bearer <access token>` (JWT) issued by
  `spring.security.oauth2.client.provider.ofsm.issuer-uri`, and only when `aud` contains one of
  `app.auth.mcp.accepted-audiences` (env `MCP_ACCEPTED_AUDIENCES`, default `ofsm`).
- Without a valid token it answers `401` with
  `WWW-Authenticate: Bearer resource_metadata="<base>/.well-known/oauth-protected-resource/mcp"`.
  That RFC 9728 metadata (also served at `/.well-known/oauth-protected-resource`) names the
  provider as authorization server; the agent then registers itself there (anonymous Dynamic
  Client Registration) and runs the authorization code flow with PKCE.
- It never creates a session and never sets a cookie.
- Roles are read from the access token claims with the same `RoleMapper` and
  `app.auth.roles.*` configuration as the browser login. The username is the configured username
  claim, falling back to `sub`.

**Tools.** `McpToolRegistry` holds a deliberate, read-only set: `listClothingTypes`,
`listClothingLocations`, `getClothingItemByBarcode`, `searchClothingItems`, `listMembers`. Tool
names reuse the `operationId` of the matching REST endpoint. When adding a tool:

- Call the same service as the REST endpoint; never duplicate domain logic in the tool.
- Set `requiredRoles` to what the REST endpoint enforces (any OFSM role for everything under
  `/api/**`, plus the `@PreAuthorize` role if there is one), and pass role-dependent flags such as
  `isKleiderwart` exactly as the controller does.
- Report failures the caller can act on (not found, missing role, invalid value) as a tool result
  with `isError: true`; only malformed calls become JSON-RPC errors.
- Write tools need their own review; the initial set is read-only on purpose.

**Using it locally (OpenCode, Claude Code).** Start the local Keycloak
(`infrastructure/local/docker-compose.yml`) and the server, then point the agent at
`http://localhost:8080/mcp`:

- OpenCode: enable `ofsm-api` in the repo-root `opencode.jsonc` (`"type": "remote"`), start
  OpenCode and run `opencode mcp auth ofsm-api` if it does not open the browser by itself.
- Claude Code: `claude mcp add --transport http ofsm-api http://localhost:8080/mcp`, then `/mcp`
  inside Claude Code to authenticate.

The browser shows the Keycloak login (demo users in `infrastructure/local/README.md`) and a
consent screen; afterwards the agent calls tools with that user's OFSM roles. The dev realm allows
anonymous registration only for redirect URIs on `localhost`/`127.0.0.1` and adds the `ofsm`
audience through the default client scope `ofsm-mcp` (details and open questions in
`docs/mcp-spike.md`). A production realm needs the same client registration policies and client
scope, with trusted hosts and audiences adjusted to the deployment.

Each tool call acts with the full OFSM roles of the signed-in account. Pick the account
accordingly; `ADMIN` implies every role.

## Database

- Spring Data JDBC is used — **not** JPA/Hibernate.
- Prefer explicit repository classes with visible SQL methods (for example with `NamedParameterJdbcTemplate`) over
  `CrudRepository`/`PagingAndSortingRepository` interfaces.
- Repositories should expose only the concrete operations needed by the feature (for example `findByUsername`,
  `existsByUsername`, `save`, `count`) to keep behavior obvious.
- Schema migrations use a **custom Kotlin migration runner** (not Flyway or Liquibase). Each migration is a `@Component` implementing the `DatabaseMigration` interface (`val id: String`, `fun execute(jdbcTemplate: JdbcTemplate)`). The runner fires automatically on startup, sorts migrations by `id`, and skips already-applied ones (tracked in the `schema_migrations` table).
- Name migration classes `V<NNN><PascalCaseDescription>` (e.g. `V017CreatePrivacyPolicyTable`). Set the `id` to `V<NNN>__<snake_case_description>` with two underscores (e.g. `"V017__create_privacy_policy_table"`). **Check the highest number actually present in `migration/` before picking one** — this line has gone stale before, and V009 and V017 each ended up used by two different migrations as a result. The runner tolerates it (it sorts by `id`, which stays unique), but the ordering between same-numbered migrations is then alphabetical and not what you intended. The next available version number is **V027**.
- The `compose.yml` spins up `postgres:latest` on a random host port; `application.yml` uses
  Docker Compose lifecycle `start_only` so the container persists across restarts.
- Database credentials for local dev: `POSTGRES_USER=myuser`, `POSTGRES_PASSWORD=secret`,
  `POSTGRES_DB=mydatabase`.
