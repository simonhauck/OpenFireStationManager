# AGENTS.md — OpenFireStationManager

Guidance for agentic coding assistants working in this repository.

## Project Overview

**OpenFireStationManager** is an open-source platform for managing firefighting stations. It is a
monorepo with two independent components:

- `client/` — React 19 + TypeScript frontend (Vite, TanStack Router, Tailwind CSS, DaisyUI)
- `server/` — Spring Boot 4 + Kotlin backend (Spring Data JDBC, PostgreSQL, SpringDoc OpenAPI)

There is no root-level build orchestrator. Each component is built and run independently.

---

## Client (`client/`)

React 19 + TypeScript frontend. See **`client/AGENTS.md`** for the full guide: commands,
testing, TypeScript rules, code style, routing, and PWA notes.

**Quick reference:**

| Purpose             | Command (from `client/`) |
| ------------------- | ------------------------ |
| Start dev server    | `npm run dev`            |
| Production build    | `npm run build`          |
| Lint (auto-fix)     | `npm run lint`           |
| Lint (check only)   | `npm run lint:check`     |
| Format (auto-fix)   | `npm run format`         |
| Format (check only) | `npm run format:check`   |

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

- **Prettier scoping:** The root `.prettierrc.json` applies to non-client, non-Kotlin files.
  `client/` has its own `.prettierrc.json`. Kotlin files are excluded from Prettier entirely.
- **Dependency updates:** Managed by Renovate (see `renovate.json`). npm dependencies are
  handled manually; Gradle/Kotlin deps are auto-merged after 14 days.
- **No CI is configured yet.** Run lint, format checks, and tests locally before committing.
- **No git hooks are installed.** Discipline is manual at this stage.
