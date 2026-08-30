
# AGENTS.md — OpenFireStationManager

Guidance for agentic coding assistants working in this repository.

## Project Overview

**OpenFireStationManager** is an open-source platform for managing firefighting stations. It is a
monorepo with two independent components:

- `client/` — React 19 + TypeScript frontend (Vite, TanStack Router, TanStack Query, shadcn/ui, Tailwind CSS)
- `server/` — Spring Boot 4 + Kotlin backend (Spring Data JDBC, PostgreSQL, SpringDoc OpenAPI)

There is no root-level build orchestrator. Each component is built and run independently.

---

## Client (`client/`)

React 19 + TypeScript frontend. See **`client/AGENTS.md`** for the full guide: commands,
testing, TypeScript rules, code style, routing, and PWA notes.

**Quick reference:**

|            Purpose             | Command (from `client/`) |
|--------------------------------|--------------------------|
| Start dev server               | `npm run dev`            |
| Run tests                      | `npm run test`           |
| Production build               | `npm run build`          |
| Format and lint check          | `npm run format:check`   |
| TypeScript type check          | `npm run build:check`    |
| Format and lint auto-fix       | `npm run format:fix`     |
| Generate frontend API bindings | `npm run prepareEnv`     |

---

## Server (`server/`)

Spring Boot 4 + Kotlin backend. See **`server/AGENTS.md`** for the full guide: commands,
testing, code style, API design, and database conventions.

**Quick reference** (the Gradle wrapper lives at the repo root, not in `server/`):

|      Purpose       |                                    Command (from repo root)                                    |
|--------------------|------------------------------------------------------------------------------------------------|
| Build              | `./gradlew :server:build`                                                                      |
| Run                | `./gradlew :server:bootRun`                                                                    |
| Test all           | `./gradlew :server:test`                                                                       |
| Single test class  | `./gradlew :server:test --tests "io.github.simonhauck.openfirestationmanager.MyTest"`          |
| Single test method | `./gradlew :server:test --tests "io.github.simonhauck.openfirestationmanager.MyTest.myMethod"` |

> **Docker must be running** before executing integration tests.

---

## The OpenAPI contract

`server/src/main/resources/open-api-contract.json` is generated from the SpringDoc annotations and
committed. It has three consumers, so an API change is never finished at the controller:

1. **The contract snapshot** — regenerate with `./update-api-definition.sh` from the repo root.
   CI fails if it is stale.
2. **The TypeScript bindings** — regenerate with `npm run prepareEnv` from `client/`.
   **Nothing in CI checks this**, so a stale binding passes unnoticed.
3. **The MCP tool surface** — the `ofsm-api` server in `opencode.jsonc` reads the same file, so
   `@Operation` and `@Schema` annotations directly determine how usable the API is to an agent.

Because of consumer 3, the SpringDoc annotation rules in `server/AGENTS.md` ("API Design") are
strict and include a worked example. Follow it rather than improvising a new style.

---

## Repository-level Notes

- **Formatting ownership:** Biome formats and lints the frontend. Spotless formats root JSON/JSONC,
  backend JSON, Kotlin, and Markdown. YAML is not formatted automatically.
- **Root Gradle usage:** Root `./gradlew` is mainly for Spotless checks/formatting on
  repo-level files (`*.gradle.kts`, JSON/JSONC, and Markdown). Build/run/test workflows remain component-local
  in `client/` and `server/`.
- **Dependency updates:** Managed by Renovate (see `renovate.json`) with auto-merge enabled and
  a 14-day minimum release age. npm updates are enabled (including grouped `@tanstack/**` updates).
- **CI workflows are configured in `.github/workflows/`.** Run lint, format checks, and tests locally before committing.
- **No git hooks are installed.** Discipline is manual at this stage.

---

## Agent skills

### Issue tracker

GitHub Issues at `simonhauck/OpenFireStationManager`. See `docs/agents/issue-tracker.md`.

### Triage labels

Default canonical labels (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See
`docs/agents/triage-labels.md`.

### Domain docs

Multi-context: `CONTEXT-MAP.md` at the root, with per-component `CONTEXT.md` and `docs/adr/` under `client/` and
`server/`. See `docs/agents/domain.md`.
