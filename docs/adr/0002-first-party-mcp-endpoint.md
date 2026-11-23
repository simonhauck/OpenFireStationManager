
# ADR-0002: OFSM hosts a first-party MCP endpoint with OAuth sign-in

**Status:** Accepted
**Date:** 2026-11-19
**Amends:** [ADR-0001](0001-mcp-secondary-consumer.md)

## Context

ADR-0001 ranked MCP as a secondary consumer of the OpenAPI contract: the external
`@ivotoby/openapi-mcp-server` turned every operation into a tool and sent a static `Cookie` header.
With OpenID Connect sign-in (#292) that setup needs a session cookie copied from the browser by
hand, which expires after the idle timeout. The MCP authorization spec offers a better path: the
server is an OAuth 2.0 protected resource, and the coding agent registers itself with the identity
provider and signs the developer in through the browser (#423).

## Decision

- The server hosts its own MCP endpoint at `/mcp` (Streamable HTTP transport, stateless, JSON
  responses only). It is a separate, stateless Spring Security filter chain acting as an OAuth2
  resource server: bearer access tokens (JWT) from the configured OIDC issuer, `aud` checked
  against `app.auth.mcp.accepted-audiences`, no session, no cookie.
- Discovery follows the MCP authorization spec: `401` with `WWW-Authenticate: Bearer
  resource_metadata=…` and RFC 9728 metadata at `/.well-known/oauth-protected-resource/mcp` naming
  the provider as authorization server. Clients register through anonymous Dynamic Client
  Registration at Keycloak (see `docs/mcp-spike.md`).
- Roles come from the access token through the same role mapper as the browser login. Each tool
  enforces the role requirement of the matching REST endpoint and calls the same service.
- The tools are a **deliberate, hand-picked, read-only** set (clothing types, locations, items by
  barcode or search, members). Write tools are added one by one in follow-ups. The tools are
  defined in code, not generated from the OpenAPI contract, and `/mcp` is not part of the contract.
- The JSON-RPC transport is implemented with plain Spring MVC and Jackson instead of a framework
  (Spring AI MCP server). The stateless subset is small (`initialize`, `ping`, `tools/list`,
  `tools/call`), and it avoids coupling the Spring Boot upgrade path to a fast-moving library. If
  MCP features beyond tools are needed (resources, prompts, streaming), revisit this choice.

## Consequences

- ADR-0001's ranking still holds for the **REST API**: the contract is designed for the generated
  TypeScript client and human readers. What changes is that MCP is no longer a consumer of the
  contract at all. `@Operation`/`@Schema` annotations stay mandatory as API documentation, but
  they no longer shape MCP tools, and an `operationId` rename no longer renames a tool.
- MCP gains a small first-party surface that has to be maintained alongside the services: a tool
  that needs a different shape than the REST endpoint can have it, without touching the REST API.
- Tool names reuse the `operationId` of the matching endpoint for continuity; they are a separate
  interface and are not renamed automatically.
- The external `@ivotoby/openapi-mcp-server` setup and the copied `OFSM_AUTH` cookie are retired;
  `opencode.jsonc` points `ofsm-api` at the remote `/mcp` URL.
- The identity provider must allow dynamic registration of public clients and add the OFSM
  audience to their tokens. The dev realm does this; production realms need the same setup.

## Alternatives rejected

- **Keep the OpenAPI-generated tools with a copied cookie:** works, but every developer copies a
  credential by hand and the whole API, including administration, becomes the tool surface.
- **Keep the generated tools and add OAuth to the external MCP server:** its auth provider is
  library-only, so this means maintaining a wrapper package outside the server, and the server
  would still need to accept bearer tokens.
- **Spring AI MCP server:** a reasonable choice once its Spring Boot 4 line is stable; not needed
  for a stateless, tools-only endpoint.
