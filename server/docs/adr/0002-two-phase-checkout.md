
# ADR-0002: Two-phase Checkout with warning acknowledgement

**Status:** Accepted
**Date:** 2026-04-29

## Context

A Checkout asserts that named items are currently at a claimed source location. In practice the system's `ClothingItem.locationId` cache may disagree with reality — items get moved without being scanned, two firefighters race for the same item, or returns happen outside the system. We need to decide how the server reacts when its records don't match the user's claim.

Possible stances:

1. **Reject** any mismatch with a hard error (409). Forces manual reconciliation by the Kleiderwart before checkout can proceed.
2. **Silently accept** the user's claim and update records. No friction, no audit trail of the disagreement.
3. **Warn and let the user confirm.** The system surfaces what it thought was true, the user asserts what is actually true, and the system accepts the correction.

Firefighters are not adversaries; they are typically reporting reality more accurately than the system's stale cache. Hard rejection blocks the everyday case in service of a problem (malicious or careless misuse) that doesn't exist here.

## Decision

The Checkout endpoint is **two-phase**:

**Phase 1 — `POST /api/clothing/checkouts`** (no acknowledgement).
The server validates and returns one of:

- `200` with `{ status: "ok", batchId: ... }` and **writes movements** if no discrepancies.
- `200` with `{ status: "needs_confirmation", warnings: [...] }` and **writes nothing** if any of the following discrepancies are detected:
  - A `takeItemId` is not currently at the claimed `sourceLocationId`.
  - A `returnItemId` is not currently at the claimed `targetLocationId`.
  - A concurrent-scan race left the item somewhere other than the claimed source between request build and request handling.

Each warning identifies the item, the claimed location, and the system's recorded location.

**Phase 2 — same endpoint with `acknowledgedWarnings: [...]`** listing the item IDs the user accepts as discrepant.
The server re-validates. Items whose discrepancies are listed in `acknowledgedWarnings` are accepted as if they had been at the claimed location. Movements are written.

### How discrepant movements are recorded

When the user acknowledges a discrepancy, the system writes a **single** `ClothingMovement` with `fromLocationId = claimedSource` (the user's assertion) and `reason = CHECKOUT` (or `RETURN`). No compensating `MANUAL_CORRECTION` is inserted; the prior drift is not retroactively explained in the log.

This is dishonest in a strict sense — an item may appear to move from a location it was never at — but it keeps the log shape simple and avoids doubling the row count for every drift event. The history page will show movements in the form firefighters actually performed; the gaps are accepted.

### Hard errors that bypass the warning flow

The following are malformed requests, not data inconsistencies, and return `400`:

- Same item ID in both `takeItemIds` and `returnItemIds`.
- Both arrays empty.
- `sourceLocationId` is not type POOL.
- `targetLocationId` is not type PERSONAL.
- `returnLocationId` (if present) is not type WAESCHE.
- The requesting user is not `KLEIDERWART` and any referenced location has `onlyVisibleForKleiderwart = true`.

## Consequences

- The client must implement a confirmation dialog showing the warnings before it can complete a checkout for a drifted dataset.
- The movement log is authoritative about what was checked out, but not about how items arrived at their pre-checkout location when drift occurred. A future "audit drift" report would need to compare the cache against actual physical inventory, not the log.
- `acknowledgedWarnings` must reference specific item IDs, not be a blanket `force: true` flag, so that newly drifted items between phase 1 and phase 2 (e.g. a third firefighter scanning during the dialog) still trigger a fresh warning and are not silently accepted.
- Phase 1 must be side-effect-free. No `batchId` is allocated until phase 2 succeeds.

## Alternatives rejected

- **Hard 409 on any mismatch.** Blocks the everyday case where the user is right and the cache is wrong. Forces Kleiderwart involvement for routine drift.
- **Silently accept the user's claim.** Loses the chance to surface drift to the user, who might catch a real mistake (wrong barcode scanned).
- **Compensating `MANUAL_CORRECTION` movement before each discrepant `CHECKOUT`** (Option Y in the grilling). Honest about the system's prior belief, but doubles row count for drift events and surfaces an internal-bookkeeping concept in user-visible history. Rejected as disproportionate.
- **Single-phase `force: true` flag.** Encourages clients to set the flag unconditionally and bypass the warning flow entirely.
