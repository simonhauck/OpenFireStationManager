
# Domain Docs

How the engineering skills should consume this repo's domain documentation when exploring the codebase.

This repo is **multi-context**: it's a monorepo with two independent components (`client/` and `server/`), each with its own domain language and architectural decisions.

## Before exploring, read these

- **`CONTEXT-MAP.md`** at the repo root — it points at one `CONTEXT.md` per context. Read each one relevant to the topic.
- **`client/CONTEXT.md`** — domain language for the React/TypeScript frontend.
- **`server/CONTEXT.md`** — domain language for the Spring Boot/Kotlin backend.
- **`docs/adr/`** at the repo root — repo-wide / cross-cutting decisions (e.g. monorepo layout, shared tooling).
- **`client/docs/adr/`** — client-specific architectural decisions.
- **`server/docs/adr/`** — server-specific architectural decisions.

When working in one component, read its own `CONTEXT.md` and `docs/adr/` first; consult the other component's docs only when the work crosses the boundary (e.g. API contracts).

If any of these files don't exist, **proceed silently**. Don't flag their absence; don't suggest creating them upfront. The producer skill (`/grill-with-docs`) creates them lazily when terms or decisions actually get resolved.

## File structure

```
/
├── CONTEXT-MAP.md
├── docs/adr/                ← repo-wide / cross-cutting decisions
├── client/
│   ├── CONTEXT.md
│   └── docs/adr/            ← client-specific decisions
└── server/
    ├── CONTEXT.md
    └── docs/adr/            ← server-specific decisions
```

## Use the glossary's vocabulary

When your output names a domain concept (in an issue title, a refactor proposal, a hypothesis, a test name), use the term as defined in the relevant `CONTEXT.md` (client or server, depending on where you're working). Don't drift to synonyms the glossary explicitly avoids.

If the concept you need isn't in the glossary yet, that's a signal — either you're inventing language the project doesn't use (reconsider) or there's a real gap (note it for `/grill-with-docs`).

## Flag ADR conflicts

If your output contradicts an existing ADR, surface it explicitly rather than silently overriding:

> _Contradicts ADR-0007 (event-sourced orders) — but worth reopening because…_
