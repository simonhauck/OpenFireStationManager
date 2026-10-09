
# ADR-0004: Adopt Astryx as the component library

**Status:** Accepted
**Date:** 2026-10-08

## Context

The client composes its UI from shadcn/ui (17 copied components in `src/components/ui/`, 15 in use
across 40 files) plus 22 app-owned components. shadcn's value proposition — owning and designing
component source — goes unused: the components are treated as read-only building blocks with minor
class tweaks. Meanwhile the app hand-rolls the pieces a full component library would provide: data
tables, comboboxes, wizards, navigation. The repository is also worked on by AI agents, which
benefit from a documented, discoverable component API.

Astryx is an open-source design system from Meta (MIT, beta, React 19+, 150+ components, 7 themes)
whose CLI, docs, and MCP server are explicitly built for humans and agents working together:
`astryx init` writes a component index into `AGENTS.md`, `astryx component` serves API docs, and
`https://astryx.atmeta.com/mcp` exposes the same catalog to agents. It ships pre-built CSS and
coexists with Tailwind v4 through a token bridge — consumers need no StyleX build plugin.

## Decision

Replace shadcn/ui and its supporting stack with Astryx in a single migration PR, committed feature
by feature.

- Dependencies removed at the end: `@radix-ui/*` (10 packages), `cmdk`, `class-variance-authority`,
  `sonner`, `@tailwindcss/typography`. Added: `@astryxdesign/core`, `@astryxdesign/theme-neutral`,
  and `@astryxdesign/cli` (dev).
- **Tailwind stays** as the layout/utility layer, wired to Astryx tokens via
  `@astryxdesign/core/tailwind-theme.css`. Removing Tailwind is explicitly not a goal.
- App chrome moves to `AppShell` + `TopNav` + `MobileNav`; the custom header and mobile menu are
  deleted. `MENU_ITEMS` role filtering moves into the new nav.
- Pickers map to `Selector` (searchable, clearable) and `Typeahead` (async scanner search); tables
  to `Table` with sorting plugins — the hand-rolled `DataTable` is dissolved; wizard chrome to
  `Stepper`; dialogs, toasts, and breadcrumbs to their Astryx equivalents. The 48px tablet tap
  targets come from a `pointer: coarse` theme adaptation, replacing the `TouchButton` /
  `TouchCombobox` wrappers.
- A custom theme (`defineTheme` extending `theme-neutral`) preserves the current palette. If that
  cannot get acceptably close, the fallback is a stock Astryx theme.
- Components are used as shipped: no swizzling, no source modification. Small visual deltas from
  the beta version are accepted; obvious regressions are flagged in the PR instead of patched.
- Thin app wrappers survive where they carry app semantics: `PageSection` / `PageSubSection`,
  `ErrorState`, `LoadingIndicator`, domain-derived selects and formatters, plus the non-UI
  components (`RenderIf`, `RoleGuard`, `FormattedDate`).
- Renovate stays enabled, auto-merge included, for `@astryxdesign/*`. Package rules are added only
  if churn actually breaks the build.

Migration order: infrastructure and theme, then Nutzer Management as pilot, then auth/Mitglieder,
desktop Klamotten CRUD, dashboard/legal/admin, tablet flows last, then final deletions and docs.

## Consequences

- Astryx is pre-1.0 (0.6.x at the time of writing) with a very high release cadence, so upgrades
  can change component APIs. `astryx upgrade --apply` codemods plus the Playwright suite are the
  safety net; Renovate auto-merge is accepted risk.
- Playwright page objects are updated per migrated feature. Visible behavior — not DOM structure —
  is the definition of correctness.
- The `AGENTS.md` component index is owned by `astryx init` inside a managed block; repo-specific
  rules stay outside it.
- `CONTEXT.md` wording that names shadcn specifics ("thin feature-local wrappers around shadcn
  primitives", "default shadcn sizing") is updated in the same PR.

## Alternatives rejected

- **Staying on shadcn/ui.** The copy-paste ownership model is unused; the missing pieces (data
  table, combobox, stepper, navigation) would remain hand-rolled, and agents would keep lacking a
  component reference.
- **Mantine / MUI / Base UI / Ark.** Mature libraries with broad component sets, but none offers
  the agent-facing tooling (CLI component docs, `AGENTS.md` integration, MCP server) that motivated
  the move, and they replace rather than coexist with the existing Tailwind styling.
- **Permanent coexistence of both systems.** Two design systems, two theming models, and two
  sources of visual truth indefinitely. Rejected in favor of one directed migration that ends with
  `src/components/ui/` and the shadcn stack deleted.
