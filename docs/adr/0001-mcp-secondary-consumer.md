
# ADR-0001: The MCP tool surface is a secondary consumer of the API contract

**Status:** Accepted
**Date:** 2026-10-11

## Context

The generated OpenAPI contract (`server/src/main/resources/open-api-contract.json`) has three consumers: the committed CI snapshot, the generated TypeScript client, and the `ofsm-api` MCP server configured in `opencode.jsonc`.

When the MCP integration was introduced, its tool surface was treated as a primary consumer. That framing is still visible in the repo guidance: root `AGENTS.md` calls the MCP server "consumer 3" and justifies the strict SpringDoc annotation rules with it, `server/AGENTS.md` calls the tool surface "the main reason the rules above are strict", and `operationId` is described as effectively locked public API. Design discussions echoed it — for example the item-list endpoint discussion in #343 weighed MCP tool ergonomics for decisions that should be client-driven.

In practice the MCP tools are used **sporadically**, mostly for one-off environment tasks such as migrations. They are not the interface this API is designed for. The primary consumers are the generated TypeScript client and humans reading Swagger and the repository.

## Decision

- MCP remains supported — the contract stays the single source of truth and the tooling keeps working — but it is a **secondary consumer**. API design decisions must not be contorted for MCP ergonomics.
- Complete `@Operation` and `@Schema` annotations remain mandatory, but their justification is **API documentation first**: Swagger, codebase navigation, contract consumers. A usable MCP tool surface falls out of good documentation for free.
- `operationId` changes follow normal review. Renaming is allowed when it improves clarity; it is no longer treated as a locked public interface. Existing names are fine to keep — this is about not blocking improvements.
- When design choices conflict (naming, response shape, granularity, visibility rules), optimize for the generated client and human consumers; MCP ergonomics are not a tiebreaker.

## Consequences

- The annotation rules stay; only their rationale is re-ranked. `operationId` renames may appear in future PRs, which is a breaking change for anyone with an MCP client configured — acceptable given the sporadic use.
- Root `AGENTS.md` and `server/AGENTS.md` wording is updated to reflect this ranking.
- If MCP usage becomes routine again, revisit this ADR and restore the stricter contract.

## Alternatives rejected

- **Remove the MCP integration:** discards a working migration tool for no gain; the contract exists for the other consumers anyway.
- **Keep MCP as a primary consumer:** misallocates design effort — e.g. #343 was partly argued around tool behavior rather than around the client.
- **Drop the annotation rules:** they cost little and they are the documentation; weakening them would hurt every consumer, including agents reading the contract through MCP.
