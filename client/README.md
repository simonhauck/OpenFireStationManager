
# OpenFireStationManager — Frontend

The React web app for [OpenFireStationManager](../README.md). It is a single-page application built
with Vite and TanStack Router, and it is served in production by the Kotlin backend rather than by a
Node server.

For what the product does and how to run the whole thing with Docker, see the
[root README](../README.md).

---

## Before you start

**The backend must be running.** This app has no server of its own and no mock layer — every screen
reads live data from the API. Start it first, from the repository root:

```bash
./gradlew :server:bootRun
```

That serves the API on port `8080`. The Vite dev server proxies `/api` and `/privacy-policy` to it,
so no environment variables are needed for local development.

You will also need a user account to sign in with. A fresh database has none — see
[Create the first account](../README.md#create-the-first-account) in the root README.

---

## Getting started

```bash
npm install
npm run prepareEnv     # generate the typed API client
npm run dev            # http://localhost:3000
```

`prepareEnv` is not optional on a first checkout. It generates `src/api/schema.ts` from the
backend's OpenAPI contract, and nothing compiles without it.

---

## How it talks to the backend

All API types are **generated, not hand-written**. `npm run prepareEnv` reads
`server/src/main/resources/open-api-contract.json` and writes `src/api/schema.ts`, which types the
`openapi-fetch` client in `src/api/client.ts`. Calling an endpoint that does not exist, or passing
the wrong body, is therefore a compile error rather than a runtime surprise.

**Re-run `prepareEnv` whenever the backend API changes.** Nothing in CI checks that the generated
file is current, so a stale one will pass the build and only fail when you touch the changed
endpoint. If a request 404s or a type looks wrong, regenerate before debugging anything else.

Authentication is a session cookie set by the backend; the client sends `credentials: "include"` and
holds no token.

---

## How it is built and deployed

`npm run build` does **not** produce a standalone bundle. It writes into
`server/src/main/resources/static/`, so the compiled frontend is packaged inside the backend JAR and
the whole product ships as one Docker image on one port.

Two consequences worth knowing:

- The output directory is emptied on each build, and it lives outside this folder.
- In production the app is served from the same origin as the API, which is why no API base URL is
  configured. `VITE_API_BASE_URL` exists as an override but is normally unset.

---

## Testing

End-to-end tests are the primary strategy here, because most of the value is in multi-step flows
like checkout and stock-taking rather than in isolated components.

```bash
npm run test        # Vitest — pure logic only
npm run test:e2e    # Playwright — the real coverage
npm run test:e2e:ui # Playwright, interactive
```

Playwright starts the backend and dev server itself, creates three test personas (`admin`,
`kleiderwart`, `user`), and signs each one in before the suite runs. Reuse an existing local server
if you have one — it will not start a second copy.

---

## Commands

|         Purpose          |        Command         |
|--------------------------|------------------------|
| Dev server               | `npm run dev`          |
| Regenerate API bindings  | `npm run prepareEnv`   |
| Production build         | `npm run build`        |
| Type check               | `npm run build:check`  |
| Lint and format check    | `npm run format:check` |
| Lint and format auto-fix | `npm run format:fix`   |
| Unit tests               | `npm run test`         |
| End-to-end tests         | `npm run test:e2e`     |

---

## Layout

```text
src/
├── api/            generated schema, typed client, shared query keys
├── clothing/       the main feature area — checkout, relocation, stock-taking
├── users/          account management
├── legal/          Impressum and privacy policy
├── components/
│   ├── ui/         shadcn/ui primitives — treat as managed, do not edit
│   ├── base/       app-wide building blocks
│   └── layout/     page shell
└── routes/         TanStack Router file-based routes (slim — they delegate to feature folders)
```

Routes stay thin on purpose: a route file wires up a page, and the actual UI and data fetching live
in the feature folder next to the rest of that domain.

---

## A note on language

The **user interface is in German** — labels, routes, and component names often use domain terms
like *Kleiderwart*, *Standort*, and *Umlagerung*. The code and comments are English.

[`CONTEXT.md`](CONTEXT.md) is the glossary for those terms and explains what each screen is for. Read
it before working on a feature; it will save you guessing what *Inventarisierung* or *Pool Klamotten*
mean.

---

## Conventions

[`AGENTS.md`](AGENTS.md) is the full contributor guide for this folder — component rules, the
required `RenderIf` pattern, routing structure, page-object conventions for Playwright, and how
schema-derived types must be organised. Read it before your first pull request.
