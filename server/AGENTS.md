
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
- Authentication uses server-side session + remember-me cookies; frontend should use cookie credentials, not browser token storage.

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
  `InitialAdminSetupIT`) instead of `IntegrationTest` in the class name.
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
    The `operationId` becomes the tool name in MCP clients and must be unique across the whole
    API; use `verb + Resource` in camelCase (`listClothingItems`, `changeUserPassword`). The
    `description` is what an LLM reads to decide whether to call the endpoint, so state what it
    does, when to prefer a sibling endpoint, and any non-obvious consequence.
  - `@ApiResponse` for the success status and for every **domain-specific** failure (`404`,
    `409`, `422`, and any `400` with a meaning beyond schema validation).
  - `@Parameter(description = …, example = …)` on every path variable and request parameter.
- Treat `operationId` as **public API**. Renaming one silently renames a tool in every MCP client,
  and because the TypeScript bindings key off paths rather than ids, nothing in this repo will
  fail to warn you. Rename only deliberately.
- Do **not** hand-write `401`, `403`, `500`, or generic `400` responses, and do not hand-write the
  required-role prose. `OpenApiConfiguration.commonResponsesCustomizer` derives all of them from
  the URL namespace and the `@PreAuthorize` expression, so they cannot drift from what is
  actually enforced. Adding them by hand produces duplicates.
- Annotate DTO and entity properties with `@field:Schema(description = …, example = …)`. These
  descriptions become the tool input schema for MCP clients, so an undocumented field is an
  unusable one. Use `@get:Schema` instead for computed properties declared in the class body
  (for example the `totalCount` values in `ClothingOverview.kt`), where there is no constructor
  parameter to annotate.
- Prefer interpolating a configured value over restating it. `OpenApiConfiguration` injects the
  cookie names and remember-me validity rather than hardcoding them, so the documentation cannot
  contradict `application.yml`. Apply the same instinct to any other configurable fact.

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
    `AdminUserController`) rather than generic REST advice here. The one exception is
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

The checked-in contract doubles as the tool definition for
[`@ivotoby/openapi-mcp-server`](https://github.com/ivo-toby/mcp-openapi-server), configured as
`ofsm-api` in the repo-root `opencode.jsonc`. Each operation becomes one MCP tool: the tool name
comes from `operationId`, its description from the `@Operation` description, and its input schema
from the `@Parameter` and `@field:Schema` annotations. Poor annotations therefore degrade the tool
surface directly — that is the main reason the rules above are strict.

**Authenticating.** The API uses cookies, and the MCP server can only send static headers. Rather
than a session cookie, use the **remember-me** cookie: it authenticates on its own, is stateless
and signed, survives server restarts, and is valid for 30 days by default
(`app.remember-me.token-validity`, `P30D`). That turns re-authentication into a monthly chore
instead of a per-session one.

Start the backend, log in **with `rememberMe: true`**, and export the cookie before starting
OpenCode:

```sh
export OFSM_AUTH_COOKIE=$(curl -s -i -X POST http://localhost:8080/api/public/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"chief","password":"secret","rememberMe":true}' \
  | grep -i '^set-cookie: OFSM_AUTH_REMEMBER_ME=' \
  | sed 's/.*OFSM_AUTH_REMEMBER_ME=\([^;]*\).*/\1/')
```

Note the cookie name is `OFSM_AUTH_REMEMBER_ME` — it is derived in `application.yml` as
`${server.servlet.session.cookie.name}_REMEMBER_ME`, so it tracks the session cookie name. If you
rename either, `OpenApiConfiguration` picks the new names up automatically, but the `curl` above
and `opencode.jsonc` must be updated by hand.

Re-export and restart OpenCode when calls start returning `401`. The agent inherits the full
rights of whichever account you use, and because `ADMIN` implicitly holds every role, an admin
cookie grants reach over user management and legal-document deletion. Pick the account
accordingly.

**Browser-based login.** There is no built-in flow that opens a login page. The package's
`AuthProvider` interface is the extension point, but it is library-only and not reachable through
the `npx` CLI. Implementing one means wrapping `OpenAPIServer` in a small local package — the
Playwright login in `client/tests/global-setup.ts` is a working precedent for extracting the
`httpOnly` cookie from a real browser session.

**Narrowing the surface.** All 46 operations load by default, which is a lot of context. Two ways
to trim it, both set via `environment` in `opencode.jsonc`:

- `"TOOLS_MODE": "dynamic"` replaces the 46 tools with three meta-tools
  (`list-api-endpoints`, `get-api-endpoint-schema`, `invoke-api-endpoint`). Much cheaper, at the
  cost of an extra round trip before each call.
- Tag filters keep administration out of reach entirely. The tags exist for exactly this:
  `Admin - Users` and `Admin - Legal` cover every destructive administrative operation.

Tag filtering is a tool-surface control, **not** authorisation — the server still enforces roles.

---

## Database

- Spring Data JDBC is used — **not** JPA/Hibernate.
- Prefer explicit repository classes with visible SQL methods (for example with `NamedParameterJdbcTemplate`) over
  `CrudRepository`/`PagingAndSortingRepository` interfaces.
- Repositories should expose only the concrete operations needed by the feature (for example `findByUsername`,
  `existsByUsername`, `save`, `count`) to keep behavior obvious.
- Schema migrations use a **custom Kotlin migration runner** (not Flyway or Liquibase). Each migration is a `@Component` implementing the `DatabaseMigration` interface (`val id: String`, `fun execute(jdbcTemplate: JdbcTemplate)`). The runner fires automatically on startup, sorts migrations by `id`, and skips already-applied ones (tracked in the `schema_migrations` table).
- Name migration classes `V<NNN><PascalCaseDescription>` (e.g. `V017CreatePrivacyPolicyTable`). Set the `id` to `V<NNN>__<snake_case_description>` with two underscores (e.g. `"V017__create_privacy_policy_table"`). **Check the highest number actually present in `migration/` before picking one** — this line has gone stale before, and V009 and V017 each ended up used by two different migrations as a result. The runner tolerates it (it sorts by `id`, which stays unique), but the ordering between same-numbered migrations is then alphabetical and not what you intended. The next available version number is **V020**.
- The `compose.yml` spins up `postgres:latest` on a random host port; `application.yml` uses
  Docker Compose lifecycle `start_only` so the container persists across restarts.
- Database credentials for local dev: `POSTGRES_USER=myuser`, `POSTGRES_PASSWORD=secret`,
  `POSTGRES_DB=mydatabase`.
