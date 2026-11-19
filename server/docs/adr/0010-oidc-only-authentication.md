
# ADR-0010: OIDC-only authentication

**Status:** Accepted
**Date:** 2026-11-19

## Context

Until now OpenFireStationManager owned its logins. A `users` table held bcrypt password hashes and
a role list, `AdminUserController` managed the accounts, a one-time `/api/public/setup/initial-admin`
endpoint created the first administrator, and a remember-me cookie kept tablets signed in. Every
station that wants single sign-on, password policies or multi-factor authentication would have to
rebuild them here, and the maintainer wants no password store in the application at all.

The decisions below were made in a grilling session for the OpenID Connect spec (#292) and
reviewed by the maintainer on 2026-11-19.

## Decision

### Scope

- **Full replacement.** Local accounts do not coexist with OpenID Connect, and there is no
  break-glass administrator. If the provider is down, nobody can sign in. This is accepted.
- **Exactly one provider**, registration id `ofsm`. A provider picker and per-provider role
  mappings have no current use.
- **The `users` table is dropped** (migration `V025__drop_users_table`), together with
  `UserAccount`, `UserService`, `UserRepository`, the role converters and the password encoder.
  Nothing in the domain references a user row: audit fields store a username string and `Member`
  is deliberately unlinked (ADR-0007). Just-in-time provisioning would recreate the role-drift
  problem, and dropping the table removes the password hashes. The `UserRole` enum stays.
- **No SCIM and no role sync.** Roles are read from token claims at sign-in and change at the next
  sign-in.

### Sessions

- **The server is a confidential client (backend for frontend).** `oauth2Login` keeps the tokens
  on the server and the browser holds only the `OFSM_AUTH` session cookie. This fits the existing
  cookie model and the convention of no browser token storage. A public SPA client holding tokens
  was considered and rejected: it exposes access and refresh tokens to XSS, and current OAuth
  guidance for browser apps recommends this pattern.
- **`SameSite=lax` instead of `strict`.** With `strict` the cookie is not sent on the cross-site
  redirect back from the provider, the saved authorization request is lost and the login breaks.
  `lax` still blocks cross-site non-GET requests, so CSRF protection stays disabled. **Constraint:
  never add state-changing `GET` endpoints.**
- **Return to the requested route.** `GET /api/public/auth/login?redirect=<relative path>` stores
  a validated relative path (starts with `/`, not `//`) and redirects to the provider. API calls
  keep answering `401`; there are no XHR redirects.
- **RP-initiated logout.** The client submits a top-level form `POST` to the logout endpoint
  because a `fetch` cannot follow a cross-origin redirect. The session and the provider session
  both end.
- **Long-lived tablet use is the provider's job.** Remember-me and `REMEMBER_ME_KEY` are removed.
  Sessions are persisted in PostgreSQL with Spring Session JDBC (#425), so restarts and updates
  no longer sign anyone out. The provider's SSO session settings decide how long a tablet stays
  signed in, and an expired OFSM session renews silently through it. No offline or refresh tokens
  are used.
- **A redirect reloads the app**, so a session that expires mid-workflow loses frontend state.
  This is mitigated with a sliding idle timeout, provider session limits longer than OFSM's, and a
  re-check of `/me` when a wizard is entered and when the tab becomes visible. Popup re-login and
  persisted wizard state are out of scope.
- **The provider must be reachable at startup.** Spring discovers the issuer metadata when the
  application starts, so the server does not start while the provider is down. Lazy discovery is
  not worth custom code.

### Identity and roles

- **The authenticated principal is the identity.** `/api/public/auth/me` keeps its
  `AuthStateResponse` but returns a `CurrentUser` (`username`, `firstName`, `lastName`, optional
  `email`, `roles`) instead of a `UserAccount`. There is no id, because no row exists.
- **Username:** `app.auth.username-claim`, default `preferred_username`, falling back to `sub`.
  It is what lands in `createdBy`, `lastModifiedBy` and `/me`.
- **Role mapping** is `OFSM role -> list of provider role names` under `app.auth.roles.mapping`.
  The keys are the closed `UserRole` enum, so typos fail at startup. Matching is exact and
  case-sensitive. Without a `mapping` the identity mapping applies; with one, it is authoritative.
- **Role claims:** a list of dot-separated claim paths (`app.auth.roles.claim-paths`, default
  `realm_access.roles`), unioned, each an array or a single string. Only the ID token and the
  UserInfo response are read. Decoding an access token the client is not the audience of is
  fragile across providers.
- **`ADMIN` implies every role**, expanded once in the role mapper, so `/me`, `@PreAuthorize` and
  `checkCurrentUserHasRole` agree without a Spring `RoleHierarchy`.
- **A user without a mapped role may sign in but gets no API access.** Everything under `/api/**`
  except `/api/public/**` requires at least one OFSM role, and the client shows a "Kein Zugriff"
  page. This is easier to diagnose than a failed login, and it keeps "authenticated" from meaning
  "anyone in a municipal realm".

### Machine clients

OFSM becomes a **remote MCP server** (`/mcp`) whose agents sign in through the provider themselves,
following the MCP authorization specification. Bearer tokens are accepted only on `/mcp`, with an
audience check and the same role mapper. Scripts and service accounts are out of scope. This
revisits ADR-0001 in the repository root, which treats MCP as a secondary consumer of the cookie
API.

### Testing

Integration tests get a session from the test-only `POST /api/test/session`, guarded by
`app.testing.enabled`. One `OidcLoginIT` drives the real flow against `navikt/mock-oauth2-server`
in Testcontainers; role-mapping combinations are covered by pure unit tests. Playwright uses the
test session for personas and has one real Keycloak sign-in and one sign-out journey.

## Consequences

- A provider outage means nobody can sign in, and the server does not start without the provider.
  Both are accepted.
- The upgrade is breaking. Deployments must configure the provider, drop `REMEMBER_ME_KEY` and
  create their users and role assignments there. The upgrade guide is part of the rollout (#424).
- Existing local accounts are not migrated. Their password hashes are deleted with the table.
- `createdBy` and `lastModifiedBy` remain plain username strings, now taken from the provider.
  Old values written by local logins stay as they are and match new ones only if the provider
  reuses the usernames.
- A future link between a `Member` and a login would use the provider's stable `sub`, not a local
  user id (see the amendment to ADR-0007).

## Alternatives Rejected

- **Local accounts next to OIDC.** Keeps a password store and a second login path. The maintainer
  explicitly requires that no break-glass account exists.
- **A public SPA client holding tokens.** Survives restarts too, but exposes the tokens to XSS.
- **Keeping `users` as a profile anchor with just-in-time provisioning.** Nothing references the
  row, and it would let roles drift from the provider.
- **Roles from SCIM or a periodic sync.** Only pays off with persisted users.
- **Mapping provider roles to OFSM roles (`providerRole -> ofsmRole`).** A typo in the OFSM role
  would not be caught at startup, and many-to-one reads worse in YAML.
- **Rejecting login for users without a mapped role.** The failure is a generic provider or
  callback error that is hard to diagnose.
