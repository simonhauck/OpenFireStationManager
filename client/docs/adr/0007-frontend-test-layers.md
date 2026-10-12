
# ADR-0007: Frontend test layers — unit-first with E2E at the browser boundary

**Status:** Accepted
**Date:** 2026-10-12

## Context

The Playwright suite grew to 94 tests across 20 specs and gates CI. The `e2e` job runs ~4m49s (215s of test execution plus ~67s setup) while the entire `tests` job — all 120 server tests, lint, the TypeScript check and 62 frontend unit tests — finishes in ~1m52s. The frontend unit tests themselves execute in under a second. Local full-suite E2E runs cost 1–3 minutes before anyone can start real work, and CI retries mask flakes.

The original direction — "frontend testing is done primarily with Playwright" (recorded in `client/AGENTS.md`) — is the cause. It pushed every rendering detail, conditional branch and dialog assertion into the slowest, flakiest layer, and encouraged re-running whole workflows just to assert a variation. It also forced UI-driven `beforeAll` preconditions, so most E2E time was spent creating fixtures through the very forms the tests were supposed to verify.

Real-browser testing still earns its place for a narrow set of behaviour that only a browser exercises: authentication/session/cookies, redirects and history, scanner input, file upload, and real API round-trips. That is not the same as testing everything in a browser.

## Decision

Adopt a three-layer policy, from cheapest to most expensive:

1. **Unit (`vitest`, node)** — owns pure logic: reducers, wizard step machines, parsers, formatters, comparators, and any derived state that can be exercised without rendering.
2. **Component (`vitest` + jsdom + Testing Library)** — a **fallback** for rendering-only concerns: conditional rendering, dialog visibility, empty/error states, and prop-driven markup. Not for workflows or navigation.
3. **E2E (`Playwright`)** — owns **exactly one happy-path test per user workflow**, plus all browser-boundary behaviour (auth/session/cookies, redirects/history, scanner input, file upload, real API round-trips).

Structure rules for E2E:

- **One test = one workflow.** A spec covers a single user journey end to end.
- **No chaining.** Do not sequence independent workflows inside one test to save setup.
- **One happy path per workflow.** A workflow's happy path is asserted exactly once across the suite.
- **No full-workflow re-runs to assert a variation.** Rendering, state and branch variations are unit/component tests. Length is a smell: if a spec grows past its one journey, it is hiding tests that belong in a lower layer.

Seeding rule: **preconditions seed through the `/api/test` endpoints**, never by re-driving a covered UI workflow. Test-profile seeding controllers call domain services with production DTOs, are included in the committed OpenAPI contract under the `Test` tag, and are consumed by Playwright through generated types.

Disposition rule: **every removed E2E test is either moved to a unit/component test, already covered by a server integration test, or consciously dropped and named.** No silent deletions.

## Consequences

- The Playwright suite stays small and fast; the slow layer tests journeys and browser boundaries, not details.
- More unit/component tests, which run in milliseconds and fail with a precise location rather than a screenshot.
- Fixture creation no longer spends E2E budget; `/api/test` seeding makes `beforeAll` cheap.
- The `/api/test` controllers become part of the contract, so they must carry full SpringDoc annotations and stay behind `app.testing.enabled`.
- Dispositions must be recorded per removed test (in the PR until a durable home exists), which is extra review effort the policy accepts in exchange for not losing coverage silently.

### Measurements

Baseline before this change (local, 2 workers, warm build):

- E2E: 94 tests, Playwright `2.6m`, wall clock `2:37`.
- Frontend unit: 62 tests, `955ms`.
- CI `e2e` job on `main`: ~4m49s job / 215s test execution / ~67s setup.

Final numbers after the migration are appended below once measured.

## Alternatives rejected

- **Playwright-first status quo:** the cause of the problem. The slowest layer was doing the work of the fastest, CI was gated on it, and retries hid flakes.
- **jsdom-first, where component tests replace workflow E2E:** drops the only layer that exercises real cookies, redirects/history, scanner input and file upload. Those boundaries are exactly where integration bugs live, so the confidence lost is not recovered elsewhere.
- **Trim E2E without changing the policy:** the suite would regrow under the old "prefer Playwright" guidance; the policy, not just the count, had to change.
