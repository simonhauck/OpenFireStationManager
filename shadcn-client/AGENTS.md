# AGENTS.md — shadcn-client

Guidance for agentic coding assistants working in the `shadcn-client/` component.

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

All commands below are run from the `shadcn-client/` directory.

---

## Commands

| Purpose                        | Command              |
| ------------------------------ | -------------------- |
| Start dev server               | `npm run dev`        |
| Production build               | `npm run build`      |
| Preview production build       | `npm run preview`    |
| Run tests                      | `npm run test`       |
| Lint                           | `npm run lint`       |
| Format check                   | `npm run format`     |
| Format + lint auto-fix         | `npm run check`      |
| Generate frontend API bindings | `npm run prepareEnv` |

---

## Component and UI Rules

- Prefer **small, reusable components** over large page-local blocks.
- Compose feature UIs from existing shadcn/ui primitives whenever possible.
- Avoid building custom-styled UI components when a shadcn equivalent exists.
- Keep custom visual styling to a minimum; prefer default shadcn look and only use utility classes
  for layout/alignment/spacing.
- Keep business logic out of presentational components; pass data and handlers via props.

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

## Implementation Preferences

- Keep code type-safe; avoid `any`.
- Prefer guard clauses and explicit error handling over silent failure.
- Reuse existing utilities/components before creating new ones.
- Keep edits minimal and feature-focused; avoid unrelated refactors.
