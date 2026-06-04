# AGENTS.md — OpenFireStationManagerClient

Guidance for agentic coding assistants working in the `client/` component.

> For monorepo-level context (project overview, Prettier scoping, CI/CD status) see the
> root `AGENTS.md`.

---

## Overview

React 19 + TypeScript frontend for OpenFireStationManager, built with Vite. Routing uses
TanStack Router, server state uses TanStack Query, and UI should be composed primarily from
shadcn/ui components.

**Tech stack:**

- React 19 + TypeScript + Vite 7
- TanStack Router (file-based routes, auto code-splitting)
- TanStack Query for API data fetching and mutations
- shadcn/ui (Radix + Tailwind) as the default component library
- OpenAPI-based frontend bindings generated via `prepareEnv`

All commands below are run from the `client/` directory.

---

## Commands

| Purpose                        | Command               |
| ------------------------------ | --------------------- |
| Start dev server               | `npm run dev`         |
| Production build               | `npm run build`       |
| Preview production build       | `npm run preview`     |
| Run unit tests                 | `npm run test`        |
| Run Playwright tests           | `npm run test:e2e`    |
| Run Playwright tests (UI mode) | `npm run test:e2e:ui` |
| Lint                           | `npm run lint`        |
| Format check                   | `npm run format`      |
| Format + lint auto-fix         | `npm run check`       |
| Generate frontend API bindings | `npm run prepareEnv`  |

---

## Testing Strategy

Frontend testing is done **primarily with Playwright** (end-to-end / integration tests).

- Write Playwright tests for all user-facing features and flows.
- Prefer Playwright tests over unit tests for UI behaviour; unit tests are reserved for pure
  utility functions and logic that is hard to exercise through the browser.
- Playwright tests live under `tests/` and are configured via `playwright.config.ts`.
- Run Playwright tests with `npm run test:e2e` (or `npm run test:e2e:ui` for interactive UI mode).

### Infrastructure

Playwright starts both the backend and the Vite dev server via `webServer` in
`playwright.config.ts`. Both use `reuseExistingServer: true`, so if you already have them
running locally Playwright will not start a second copy.

The backend is started with `SPRING_PROFILES_ACTIVE=test`, which enables the
`POST /api/test/users` endpoint used by global setup to create test personas. This endpoint
does **not** exist in the production profile.

### Folder structure

```text
tests/
├── global-setup.ts     ← creates personas, saves auth state to playwright/.auth/
├── pages/              ← page objects (one per route/feature)
└── flows/              ← reusable multi-step sequences used as test preconditions
playwright.config.ts
playwright/.auth/       ← gitignored session state files written by global-setup
```

Specs live under `tests/specs/` and follow the naming convention `<feature>.spec.ts`.

### Authentication

`global-setup.ts` runs once before the test suite. It creates three test personas with
UUID-suffixed usernames (so parallel runs and shared databases never collide), logs each one
in via the browser, and saves the resulting session cookies:

| Persona       | Roles         | Auth file                           |
| ------------- | ------------- | ----------------------------------- |
| `admin`       | `ADMIN`       | `playwright/.auth/admin.json`       |
| `kleiderwart` | `KLEIDERWART` | `playwright/.auth/kleiderwart.json` |
| `user`        | `USER`        | `playwright/.auth/user.json`        |

Activate a persona in a spec with `test.use`:

```ts
test.use({ storageState: "playwright/.auth/kleiderwart.json" })
```

### Page Object pattern

Every route gets a page object in `tests/pages/`. A page object owns:

- Navigation helpers (`goto()`, `gotoNew()`, etc.)
- Locator methods that return a `Locator` for a specific element (for assertions in tests)
- Action methods that interact with the page (`fillName()`, `submitForm()`, etc.)

Page objects do **not** contain assertions. Keep `expect(...)` calls in the spec files.

```ts
// ✅ correct — page object returns a locator, spec asserts
await expect(typesPage.typeRow(name)).toBeVisible()

// ❌ avoid — assertion inside page object hides intent from the test
await typesPage.assertTypeVisible(name)
```

### Flow helpers

Reusable multi-step sequences that set up preconditions live in `tests/flows/`. A flow
composes one or more page objects to perform a complete sub-task (e.g. create a clothing
type) and leaves the page in a known state (typically the list page after a successful
create).

Use flows inside `test.beforeAll` or at the start of a test to establish the data a test
depends on — never to perform the action being tested.

```ts
// ✅ correct — flow used as precondition, spec tests the real behaviour
test.beforeAll(async ({ browser }) => {
  const page = await browser.newPage({
    storageState: "playwright/.auth/kleiderwart.json",
  })
  typeName = await createClothingType(page, `Typ-${randomUUID().slice(0, 8)}`)
  await page.close()
})

test("creates an item of that type", async ({ page }) => {
  // ... uses typeName as a precondition, not the thing under test
})
```

### Data isolation

Tests share a database with manual testing and with each other. To stay safe:

- Use `randomUUID().slice(0, 8)` suffixes for all names and barcodes created in tests.
- Never rely on a clean database; never delete data after a test.
- Never hardcode IDs; look up the ID from the rendered UI if needed.

### Scope

Focus on **main user flows** — happy-path end-to-end coverage of each feature. Do not test
every invariant or validation edge case through Playwright; those belong in unit tests.

---

## Component and UI Rules

- Prefer **small, reusable components** over large page-local blocks.
- Compose feature UIs from existing shadcn/ui primitives whenever possible.
- Avoid building custom-styled UI components when a shadcn equivalent exists.
- Keep custom visual styling to a minimum; prefer default shadcn look and only use utility classes
  for layout/alignment/spacing.
- Keep business logic out of presentational components; pass data and handlers via props.

### Conditional Rendering

- **Always** use the `RenderIf` component (`src/components/base/RenderIf.tsx`) for conditional
  rendering inside JSX. Do **not** use inline `&&` short-circuits or ternary expressions to
  conditionally render elements.
- For ternary (either/or) cases, use two adjacent `<RenderIf>` components with complementary
  `when` conditions.
- Guard-clause early returns (loading/error states at the top of a component function) are fine
  and do not need `RenderIf`.

```tsx
// ✅ correct
<RenderIf when={isLoading}>
  <LoadingIndicator />
</RenderIf>
<RenderIf when={!isLoading}>
  <Content />
</RenderIf>

// ❌ avoid
{isLoading ? <LoadingIndicator /> : <Content />}
{isLoading && <LoadingIndicator />}
```

### shadcn/ui Update Safety

- Treat files in `src/components/ui/*` as shadcn-managed building blocks.
- **Do not modify shadcn component source directly** unless absolutely required.
- If customization is needed, wrap shadcn components in feature/base components instead of
  editing `src/components/ui/*`.
- This keeps future shadcn updates straightforward and low-risk.

---

## API Bindings and Data Layer

- Frontend schema/types are generated from the backend OpenAPI contract.
- Regenerate bindings with:

```sh
npm run prepareEnv
```

- Generated output is written to `src/api/schema.ts`; do not hand-edit generated sections.
- Keep feature-specific query/mutation definitions inside the corresponding feature folder
  (for example `src/clothing/service/queries/*`) and reuse shared query keys from
  `src/api/queryKeys.ts`.
- Use TanStack Query (`useQuery`, `useMutation`, invalidation) for server state, not ad-hoc
  fetch state in components.

---

## Routing

- Routes live under `src/routes/` and must export a `Route` created with `createFileRoute`.
- Use TanStack Router navigation (`Link`, `useNavigate`) for internal navigation.
- Keep route files focused on route concerns; extract reusable UI to components when route files
  become large.

### Feature-folder Routing Convention

- Organize domain functionality in feature folders under `src/<feature>/` (for example `src/clothing/`).
- Keep route files intentionally slim: route declaration + lightweight wiring only.
- Implement page UI, data-fetching hooks, and feature-specific components inside the feature folder.
- Prefer route files that delegate to a single feature entry component (for example
  `src/routes/klamottenmanagement/types.tsx` -> `src/clothing/components/ClothingTypesPage.tsx`).

---

## Project Structure (current)

```text
src/
├── api/                  ← API client, query keys, query/mutation options, generated schema
├── clothing/             ← feature module (components, model, service/queries)
├── components/
│   ├── ui/               ← shadcn/ui components (treat as managed)
│   ├── base/             ← app-specific base components
│   └── layout/           ← layout components
├── routes/               ← TanStack Router route files
├── users/                ← users feature module (components, service, metadata)
├── main.tsx              ← app bootstrap (router/query providers)
├── router.tsx            ← router setup
└── routeTree.gen.ts      ← auto-generated, never edit manually
```

---

## Schema-Derived Types

All types extracted from the generated API schema (`components["schemas"]["..."]`)
**must** live in a central model file under the corresponding domain's `model/` directory.

- Use `src/<domain>/model/` for domain-specific types (e.g. `clothing/model/clothingItems.ts`,
  `users/model/user.ts`, `legal/model/legal.ts`).
- Use `src/api/model/` for auth/API-level types (e.g. `api/model/auth.ts`).
- Do **not** define schema-derived type aliases inline in query, service, or component files —
  always import them from the domain's model file.

```ts
// ✅ correct — import from the domain's model
import type { ClothingItem } from "#/clothing/model/clothingItems"

// ❌ avoid — inline type alias in a query/service file
import type { components } from "#/api/schema"
type ClothingItem = components["schemas"]["ClothingItem"]
```

---

## Implementation Preferences

- Keep code type-safe; avoid `any`.
- Prefer `undefined` over `null` for absent values.
- Prefer guard clauses and explicit error handling over silent failure.
- Reuse existing utilities/components before creating new ones.
- Keep edits minimal and feature-focused; avoid unrelated refactors.
