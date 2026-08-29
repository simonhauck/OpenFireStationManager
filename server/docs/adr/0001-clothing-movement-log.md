
# ADR-0001: Append-only `ClothingMovement` log with denormalised current location

**Status:** Accepted
**Date:** 2026-04-29

## Context

`ClothingItem` currently has a single nullable `locationId`. We are adding a checkout flow where firefighters move items from POOL locations to PERSONAL locations and return items to WAESCHE locations. Operationally we need to answer "who had this item, and when?" — both for a future history page and for resolving disputes.

Two model shapes were considered:

1. **Stateless update** — checkout just rewrites `ClothingItem.locationId`. Trivial, but no audit trail.
2. **Event log** — every location change appends a `ClothingMovement` row.

Within the event-log option, a further branch: keep `ClothingItem.locationId` as a denormalised cache, or derive current location from the latest movement.

## Decision

- Add a `clothing_movement` table: append-only, one row per item per move.
  - Fields: `id`, `itemId`, `fromLocationId` (nullable for the genesis row), `toLocationId` (nullable if an item is unassigned), `performedAt`, `performedByUserId` (the logged-in account that submitted the request — may be a shared tablet account; the semantic actor is implied by the target PERSONAL location), `reason`, `batchId` (nullable; groups movements created by the same checkout).
  - `reason` enum: `CHECKOUT`, `RETURN`, `MANUAL_CORRECTION`, `INITIAL_PLACEMENT`.
- Keep `ClothingItem.locationId` as a denormalised cache of the current location.
- Every code path that mutates `ClothingItem.locationId` must, in the same transaction, append a `ClothingMovement` row — including manual edits by the Kleiderwart (`reason = MANUAL_CORRECTION`) and item creation with an initial location (`reason = INITIAL_PLACEMENT`).
- Existing items at cutover are not backfilled with synthetic movements; the log starts empty.

## Consequences

- The cache invariant — `ClothingItem.locationId` equals the `toLocationId` of the latest `ClothingMovement` for that item, or there are no movements — must be enforced by funnelling all writes through a single service. An integration test pins the invariant.
- Existing CRUD paths (`ClothingItemController.PATCH`, batch import) need to be updated to write a movement alongside the location change.
- The history page becomes a straightforward query against `clothing_movement`. No window functions needed for "current state" queries since the cache exists.
- A pre-cutover item with `locationId = X` and zero movements is a legal state. Reads must tolerate this.
- **`ClothingItem` deletion cascades to its `ClothingMovement` rows.** Deleting an item permanently removes its history. Future history reports cannot answer "what items did Locker 1 hold last year?" for items that have since been deleted. This is accepted: the audit trail's primary purpose is operational accountability for items currently in circulation, not archaeology.

## Alternatives rejected

- **Stateless update (no log).** Cheapest, but the checkout feature's actual value is the audit trail; without it we've built a slower version of the existing edit form.
- **Derive current location from the log (no cache).** Forces rewriting every list view (`findByLocationId`, dashboard summary, item overview) into window-function queries and demands a genesis movement for every existing item. Disproportionate for a feature whose hot path is "list items at location X".
- **Skip movements for manual Kleiderwart edits.** Creates invisible gaps in the audit trail and breaks the cache invariant. Rejected to keep the log authoritative.
