
# AGENTS.md — OpenFireStationManager

Guidance for agentic coding assistants.

Open-source firefighting-station management platform. This monorepo has two independent components
and no root build orchestrator; each is built and run separately.

- `client/` — React 19 + TypeScript (Vite, TanStack Router/Query, Astryx, Tailwind CSS)
- `server/` — Spring Boot 4 + Kotlin (Spring Data JDBC, PostgreSQL, SpringDoc OpenAPI)

## Client (`client/`)

Read `client/AGENTS.md` for testing, TypeScript rules, code style, routing, and PWA notes.

From `client/`: `npm run dev` (dev server), `npm run test` (tests), `npm run build` (production
build), `npm run format:check` / `format:fix` (lint/format), `npm run build:check` (type check),
`npm run prepareEnv` (API bindings).

## Server (`server/`)

Read `server/AGENTS.md` for testing, code style, API design, and database conventions.

The Gradle wrapper is at the repo root, not in `server/`. From the repo root:

- `./gradlew :server:build` — build
- `./gradlew :server:bootRun` — run
- `./gradlew :server:test` — all tests
- `./gradlew :server:test --tests "io.github.simonhauck.openfirestationmanager.MyTest"` — one class;
  add `.myMethod` for one method

Docker must be running before integration tests.

## OpenAPI contract

`server/src/main/resources/open-api-contract.json` is generated from SpringDoc annotations and
committed. An API change is not finished at the controller; update all three consumers:

1. **Contract snapshot:** `./update-api-definition.sh` from the repo root. CI fails if it is stale.
2. **TypeScript bindings:** `npm run prepareEnv` from `client/`. No CI check, so a stale binding
   passes unnoticed.
3. **MCP surface:** the `ofsm-api` server in `opencode.jsonc` reads the same file, so
   `@Operation`/`@Schema` shape its usability. This consumer is secondary, used sporadically for
   environment tasks, and does not drive API design (see `docs/adr/0001`).

The SpringDoc annotation rules in `server/AGENTS.md` ("API Design") are strict and include a worked
example; follow them rather than improvising. MCP ergonomics are not the reason for the rules.

## Repository notes

- **Formatting:** Biome formats/lints the frontend. Spotless formats root JSON/JSONC, backend JSON,
  Kotlin, and Markdown. YAML is not auto-formatted.
- **Root Gradle:** mainly Spotless checks/formatting on repo-level files (`*.gradle.kts`,
  JSON/JSONC, Markdown). Build/run/test workflows stay component-local.
- **Dependencies:** Renovate (auto-merge, 14-day minimum release age); npm updates are enabled,
  including grouped `@tanstack/**` updates.
- **CI:** workflows live in `.github/workflows/`. Run lint, format checks, and tests locally before
  committing.
- **No git hooks:** discipline is manual.

## Pull requests

**Titles:** Describe the change, never the branch. Use an imperative, sentence-case summary, e.g.
`Fix return selection desync in checkout wizard (#323)` or `Client: add pagination to the members
list`. Add the area prefix (`Client:`, `Server:`, `Docs:`) when not obvious and the issue reference
when there is one. Titles appear verbatim in release notes and become the squash-merge commit
message, so they must stand alone.

Never use branch-name artifacts (`opencode/...`, `feat/...`, timestamps, bare issue numbers). Always
pass `--title` to `gh pr create`; otherwise it falls back to the branch name.

**Labels:** Use the label matching the change so release notes categorize it correctly
(`.github/release.yml`): `enhancement` (features), `bug` (fixes), `dependencies` (dependency
updates). Anything else, including unlabeled PRs, lands in "Chores & Other".

## Agent skills

- **Issue tracker:** GitHub Issues at `simonhauck/OpenFireStationManager`; see
  `docs/agents/issue-tracker.md`.
- **Triage labels:** canonical labels are `needs-triage`, `needs-info`, `ready-for-agent`,
  `ready-for-human`, `wontfix`; see `docs/agents/triage-labels.md`.
- **Domain docs:** multi-context setup with `CONTEXT-MAP.md` at the root and per-component
  `CONTEXT.md` and `docs/adr/` under `client/` and `server/`; see `docs/agents/domain.md`.
