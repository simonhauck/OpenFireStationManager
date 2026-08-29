# ADR-0005: Two-phase inventory reconciliation endpoint with new movement reason

**Status:** Accepted
**Date:** 2026-06-12

## Context

The Kleiderwart needs to reconcile the system's records for a location against physical reality — scanning all items physically present and having the system compute and apply the differences. The existing Relocation endpoint (ADR-0003) moves items *to* a target in a single phase. The existing Checkout endpoint (ADR-0002) is two-phase but locked to POOL → PERSONAL semantics.

A new Inventarisierung (inventory reconciliation) endpoint is required that:
- Computes the diff (unchanged / found / missing) server-side
- Shows the diff before applying changes (two-phase)
- Accepts any location type
- Is restricted to `KLEIDERWART`
- Uses a distinct movement reason to distinguish reconciliation from relocation, checkout, and manual corrections

## Decision

Two endpoints under `POST /api/clothing/inventory-reconciliation/{locationId}/`:

**Phase 1 — `/preview`:**
- Input: `{ scannedItemIds: number[] }`
- Compares scanned IDs against the items currently recorded at `locationId`
- Returns: `{ unchangedItems: ResolvedClothingItem[], foundItems: ResolvedClothingItem[], missingItems: ResolvedClothingItem[] }`
- No side effects. No transaction.

**Phase 2 — `/execute`:**
- Input: the full preview response body
- Writes movements for found items (`fromLocationId = current → toLocationId = checkedLocation`) and missing items (`fromLocationId = checkedLocation → toLocationId = null`)
- Movement reason: `INVENTORY_RECONCILIATION` for all movements
- All movements in one `@Transactional` method sharing a UUID `batchId`
- No re-validation of the preview state — trusts the preview
- Returns: `{ batchId, foundItemsCount, missingItemsCount, unchangedItemsCount }`
- Secured via `@PreAuthorize("hasRole('ROLE_KLEIDERWART')")`

### Why two-phase instead of single-phase?

The preview gives the Kleiderwart a confirmation safety net before an irreversible batch change. Unlike Relocation (where the operator knows exactly what's being moved), Inventarisierung produces a computed diff that the operator should review.

### Why no re-validation on execute?

Unlike Checkout (ADR-0002), Inventarisierung is Kleiderwart-only and runs in a single session. The window between preview and execute has a single actor; concurrent changes are negligible. The Kleiderwart is the authority — re-validating adds complexity for no practical benefit.

### Why a new movement reason?

Using `MANUAL_CORRECTION` would make bulk inventory checks indistinguishable in the audit log from single-item Kleiderwart edits. `INVENTORY_RECONCILIATION` allows auditors to distinguish "found/missing during an inventory check" from "manual correction by the Kleiderwart."

## Consequences

- No migration needed since `reason` is stored as `VARCHAR` in the database.
- `INVENTORY_RECONCILIATION` rows will appear in the movement log for both found and missing items, all sharing the same `batchId`.
- Items moved to `null` ("Kein Standort") appear in the log with `toLocationId = null`, consistent with the existing nullable column.
- The preview response uses `ResolvedClothingItem` for all items, which already carries `clothingItem`, `location`, and `clothingType` — sufficient for diff display.

## Alternatives Rejected

- **Single-phase (preview + execute combined into one call):** Loses the confirmation safety net. The diff is only visible after the changes are applied.
- **Reusing `MANUAL_CORRECTION` reason:** Loses audit trail clarity. A future "when was item X lost?" query cannot distinguish a bulk inventory result from a one-off manual edit.
- **Revalidation on execute:** The window is a single Kleiderwart session. Re-validation adds complexity for no practical benefit.
- **Client-side diff:** Duplicates logic and makes reconciliation unavailable to non-UI consumers.

