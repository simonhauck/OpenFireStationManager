
# Context Map

OpenFireStationManager is a monorepo with two independent contexts. Each has its own glossary and architectural decisions.

| Context |   Path    |         Stack          |      Glossary       |
|---------|-----------|------------------------|---------------------|
| Client  | `client/` | React 19 + TypeScript  | `client/CONTEXT.md` |
| Server  | `server/` | Spring Boot 4 + Kotlin | `server/CONTEXT.md` |

Cross-cutting decisions live in `docs/adr/` at the repo root. Context-specific decisions live under `client/docs/adr/` and `server/docs/adr/`.
