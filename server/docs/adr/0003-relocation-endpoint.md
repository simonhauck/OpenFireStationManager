# ADR-0003: Single-phase relocation endpoint with no discrepancy protocol

**Status:** Accepted
**Date:** 2026-05-05

## Context

The Kleiderwart needs to physically move groups of clothing items between locations (e.g. restocking POOL locations, bulk-returning items to WAESCHE, filling a personal locker without a firefighter present). The existing Checkout endpoint is locked to POOL → PERSONAL semantics and requires a firefighter actor; it cannot serve this use case.

A new Umlagerung (relocation) endpoint is required that:

- Accepts any target location regardless of type
- Infers the source location per item from its current `locationId` in the database
- Requires no user-declared source — so there is nothing to disagree with
- Is restricted to the `KLEIDERWART` role

## Decision

`POST /api/clothing/relocation` accepts `{ targetLocationId, itemIds }`.

- The service infers `fromLocationId` per item from the item's current `locationId`.
- There is no discrepancy detection and no two-phase flow (contrast with ADR-0002). The Kleiderwart is physically holding the items and moving them; by definition, the source is wherever the system says they are.
- All moves are written in one `@Transactional` method sharing a UUID `batchId` with `reason = RELOCATION`.
- The endpoint is secured via `@PreAuthorize("hasRole('ROLE_KLEIDERWART')")`. Admin users implicitly have all roles (including KLEIDERWART) due to `UserDetailsServiceImpl` granting all roles to admins.

Validation:
- `itemIds` must be non-empty (enforced by `@NotEmpty`)
- `targetLocationId` must reference an existing location
- Each item ID must reference an existing item

## Consequences

- Relocations are distinguishable from Checkouts, Returns, and Manual Corrections in the movement log via `reason = RELOCATION`.
- The shared `batchId` allows auditors to reconstruct exactly which items moved where in a single Umlagerung operation.
- The TODO in `MovementService.recordMovement` questioning whether `batchId` is required is resolved in favour of keeping it — this feature confirms its value for auditing batch operations.
- No migration is needed since `reason` is stored as `VARCHAR` in the database.

## Alternatives Rejected

- **Adding a discrepancy protocol to Relocation:** The Kleiderwart is physically performing the move; there is no meaningful discrepancy to report. A single-phase design is simpler and faster.
- **Restricting target location type:** The PRD explicitly allows any location type as a target for relocations.
- **Reusing the Checkout endpoint with special flags:** Would complicate the existing checkout flow and blur the semantic distinction between Checkout and Relocation in the movement log.

