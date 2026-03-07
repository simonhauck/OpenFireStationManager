# AGENTS.md — server

Guidance for agentic coding assistants working in the `server/` component.

> For monorepo-level context (project overview, root Prettier config, CI/CD status) see the
> root `AGENTS.md`.

---

## Overview

Spring Boot 4 + Kotlin backend that serves the OpenFireStationManager REST API. Uses Spring Data
JDBC for persistence, PostgreSQL as the database, and SpringDoc OpenAPI for API documentation.

**Tech stack:**
- Kotlin 2.2.21, Java 24
- Spring Boot 4.0.3 (Spring MVC, Spring Data JDBC, Spring Validation)
- PostgreSQL (via Docker Compose, `compose.yml`)
- SpringDoc OpenAPI 3.0.2 — Swagger UI at `/swagger-ui.html`, schema at `/api/schema.json`
- Jackson + `jackson-module-kotlin`
- Gradle 9.3.1 (Kotlin DSL, `build.gradle.kts`)

All commands below are run from the `server/` directory using the Gradle wrapper.

---

## Commands

| Purpose | Command |
|---|---|
| Build (compile + test + JAR) | `./gradlew build` |
| Run application | `./gradlew bootRun` |
| Run all tests | `./gradlew test` |
| Run a single test class | `./gradlew test --tests "io.github.simonhauck.openfirestationmanager.MyTest"` |
| Run a single test method | `./gradlew test --tests "io.github.simonhauck.openfirestationmanager.MyTest.myMethod"` |
| Run tests with verbose output | `./gradlew test --info` |
| Clean build artifacts | `./gradlew clean` |

---

## Testing

Tests use **JUnit 5** via `useJUnitPlatform()`. **Docker must be running** before executing
integration tests — `IntegrationTest` uses Spring Boot's Docker Compose integration to spin up
PostgreSQL automatically (`spring.docker.compose.skip.in-tests=false`).

**Base classes:**
- Extend `IntegrationTest` for tests that need a running application context and database.
- Use plain JUnit 5 (no base class) for pure unit tests that don't need Spring context.

**Patterns:**
- Name test classes with a `Test` or `Tests` suffix.
- One `@Test` method per behaviour; use descriptive method names (`contextLoads`, `shouldReturn404WhenNotFound`).
- Prefer `@Test` + assertions over `@ParameterizedTest` unless testing multiple inputs of the
  same behaviour.

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

No Kotlin formatter (ktlint/detekt) is configured. Follow standard IntelliJ/Kotlin defaults.

### Formatting

- 4-space indentation, no tabs.
- Max line length: ~120 characters (IntelliJ default).
- Opening braces on the same line; no blank line after class/function opening brace.
- Trailing commas in multi-line argument/parameter lists.

### Naming Conventions

| Element | Convention | Example |
|---|---|---|
| Classes / objects / interfaces | `PascalCase` | `StationController` |
| Functions and properties | `camelCase` | `findById` |
| Local variables | `camelCase` | `stationId` |
| Top-level constants | `SCREAMING_SNAKE_CASE` | `DEFAULT_PAGE_SIZE` |
| Packages | lowercase, reverse-domain | `io.github.simonhauck.openfirestationmanager.station` |
| Test classes | suffix `Test` or `Tests` | `StationServiceTests` |

### Kotlin Specifics

- **`-Xjsr305=strict` is active** — Spring `@Nullable`/`@NonNull` annotations are enforced as
  Kotlin null-safety constraints. Respect them; never suppress with `@Suppress`.
- **`-Xannotation-default-target=param-property`** — Spring validation annotations (e.g.
  `@NotBlank`) on constructor parameters apply to both the field and the constructor parameter,
  so you don't need explicit `@field:` use-site targets.
- Use Kotlin **data classes** for DTOs and value objects.
- Prefer `val` over `var`; use immutable collections (`listOf`, `mapOf`) where possible.
- **Avoid `!!`** (non-null assertion); use `?.let { }`, `?: error("…")`, or safe casts instead.
- Prefer `require()` / `check()` / `error()` for precondition and invariant failures.

### Imports

Follow standard Kotlin import ordering (IDE-managed):
1. `java.*` / `javax.*`
2. `kotlin.*`
3. Third-party libraries (Spring, Jackson, etc.)
4. Project-internal packages (`io.github.simonhauck.openfirestationmanager.*`)

Remove unused imports before committing. Do not use wildcard imports (`import foo.*`).

### Error Handling

- Throw specific exception types; never catch `Exception` or `Throwable` broadly.
- Use `@ControllerAdvice` + `@ExceptionHandler` to map domain exceptions to HTTP responses;
  do not let exceptions bubble up to Spring's default handler.
- Return structured error bodies (e.g. a `ProblemDetail` or custom error DTO) consistently.
- In service/domain code, use `require()` for argument validation and `check()` for state
  invariants; these throw `IllegalArgumentException` / `IllegalStateException` respectively.

---

## API Design

- All REST endpoints **must** be documented with SpringDoc annotations (`@Operation`,
  `@ApiResponse`, `@Parameter`, etc.) so they appear correctly in `/api/schema.json`.
- Follow RESTful conventions:
  - Resource-oriented URLs: `/stations`, `/stations/{id}`
  - Use appropriate HTTP verbs: `GET` (read), `POST` (create), `PUT`/`PATCH` (update), `DELETE`
  - Return `201 Created` with `Location` header on successful creation.
  - Return `404 Not Found` for missing resources; `422 Unprocessable Entity` for validation errors.
- Validate all request bodies and path variables with Spring Validation annotations; rely on
  the `@ControllerAdvice` to translate `MethodArgumentNotValidException` into 422 responses.
- Use Kotlin data classes as request/response DTOs; keep them separate from domain/entity classes.

---

## Database

- Spring Data JDBC is used — **not** JPA/Hibernate. Repositories extend `CrudRepository` or
  `PagingAndSortingRepository`.
- Schema migrations should use Flyway or Liquibase (not yet configured; add when first migration
  is needed).
- The `compose.yml` spins up `postgres:latest` on a random host port; `application.yml` uses
  Docker Compose lifecycle `start_only` so the container persists across restarts.
- Database credentials for local dev: `POSTGRES_USER=myuser`, `POSTGRES_PASSWORD=secret`,
  `POSTGRES_DB=mydatabase`.
