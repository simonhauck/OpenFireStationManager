# AGENTS.md — OpenFireStationManager

Guidance for agentic coding assistants working in this repository.

## Project Overview

**OpenFireStationManager** is an open-source platform for managing firefighting stations. It is a
monorepo with two independent components:

- `client/` — React 19 + TypeScript frontend (Vite, TanStack Router, TanStack Query, shadcn/ui, Tailwind CSS)
- `server/` — Spring Boot 4 + Kotlin backend (Spring Data JDBC, PostgreSQL, SpringDoc OpenAPI)

There is no root-level build orchestrator. Each component is built and run independently.

---

## Root project

The root project provides Spotless formatting for root-level files (`.kts`, JSON, YAML) via the
Gradle wrapper.

**Quick reference (from repo root):**

| Purpose              | Command                         |
| -------------------- | ------------------------------- |
| Apply formatting     | `./gradlew spotlessApply`       |
| Check formatting     | `./gradlew spotlessCheck`       |
| Run all checks       | `./gradlew check`               |

---

## Client (`client/`)

React 19 + TypeScript frontend. See **`client/AGENTS.md`** for the full guide: commands,
testing, TypeScript rules, code style, routing, and PWA notes.

**Quick reference:**

| Purpose                        | Command (from `client/`) |
| ------------------------------ | ------------------------ |
| Start dev server               | `npm run dev`            |
| Run tests                      | `npm run test`           |
| Production build               | `npm run build`          |
| Lint                           | `npm run lint`           |
| Format check                   | `npm run format`         |
| Format + lint auto-fix         | `npm run check`          |
| Generate frontend API bindings | `npm run prepareEnv`     |

---

## Server (`server/`)

Spring Boot 4 + Kotlin backend. See **`server/AGENTS.md`** for the full guide: commands,
testing, code style, API design, and database conventions.

**Quick reference:**

| Purpose            | Command (from `server/`)                                                               |
| ------------------ | -------------------------------------------------------------------------------------- |
| Build              | `./gradlew build`                                                                      |
| Run                | `./gradlew bootRun`                                                                    |
| Test all           | `./gradlew test`                                                                       |
| Single test class  | `./gradlew test --tests "io.github.simonhauck.openfirestationmanager.MyTest"`          |
| Single test method | `./gradlew test --tests "io.github.simonhauck.openfirestationmanager.MyTest.myMethod"` |

> **Docker must be running** before executing integration tests.

---

## Repository-level Notes

- **Formatting:** The root `build.gradle.kts` uses Spotless to format root-level files: `.kts` files
  with ktfmt, JSON and YAML files with Jackson. Run `./gradlew spotlessApply` from the root to
  apply formatting, or `./gradlew spotlessCheck` to verify. The `client/` and `server/` directories
  are excluded from root-level Spotless — each module manages its own formatting.
- **Dependency updates:** Managed by Renovate (see `renovate.json`). npm dependencies are
  handled manually; Gradle/Kotlin deps are auto-merged after 14 days.
- **No CI is configured yet.** Run lint, format checks, and tests locally before committing.
- **No git hooks are installed.** Discipline is manual at this stage.
