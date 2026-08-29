# ADR-0003: Inventory Reconciliation wizard — location-first step order with server-side diff

**Status:** Accepted
**Date:** 2026-06-12

## Context

The Kleiderwart needs a wizard for reconciling the system's records for a location against physical reality — scanning all items physically present at a location and having the system compute and apply the differences. The existing Relocation wizard (ADR-0002) moves items _to_ a target; the existing Checkout wizard (ADR-0001) handles POOL → PERSONAL exchanges. Neither handles the "what's here vs. what should be here" reconciliation pattern.

A new Inventarisierung (inventory reconciliation) wizard is added at `/pool-clothing/inventory-reconciliation`.

## Decision

### Step order: location-first, 4 steps

1. **Standort wählen** — searchable combobox over all locations (no type restriction)
2. **Kleidung scannen** — shared `ClothingItemScanner` component with running scan count
3. **Differenzen & Bestätigen** — calls `POST /api/clothing/inventory-reconciliation/{locationId}/preview`, displays three sections (unchanged / found / missing) with a warning that missing items will be moved to "Kein Standort", then a "Inventarisierung abschließen" button calls the `/execute` endpoint
4. **Fertig** — summary with found/missing/unchanged counts and auto-redirect to `/pool-clothing`

Location-first was chosen for the same reasons as Relocation (ADR-0002): the location is the primary decision, and forcing it first commits the operator to the context before scanning.

### Server-side diff via two-phase API

The preview endpoint computes the diff (unchanged / found / missing) server-side and returns it without side effects. The execute endpoint takes the full preview response and applies the changes. This avoids duplicating diff logic in the client and makes the diff computation reusable.

### Shared ClothingItemScanner

The existing `ClothingItemScanner` component is reused. The parent owns item list state; the scanner displays a running count in the step description. Scanned items from any location are accepted — the diff is computed server-side.

### No discrepancy protocol

The Kleiderwart is physically performing the reconciliation. As with Relocation (ADR-0002), there is no discrepancy protocol — the Kleiderwart is the authority.

### Role guard

The route is role-guarded to `KLEIDERWART` via `RoleGuard`. The entry point button ("Inventarisierung starten") on the Pool Klamotten page renders only for users with `KLEIDERWART` or `ADMIN`.

### State machine

Follows the `useReducer` pattern used by `useRelocationWizard` and `useReturnWizard`. Steps encoded as `1 | 2 | 3 | 4`.

## Consequences

- The diff logic lives on the server, making it available to future consumers (e.g. admin reports) without client-side duplication.
- The execute endpoint trusts the preview response — no re-validation. The window between preview and execute is a single user session with a single actor; concurrent modification risk is negligible.
- The wizard is a single route with internal step state (same as Relocation, ADR-0002). Browser back exits the wizard.

## Alternatives Rejected

- **Client-side diff:** Trivial to compute (set difference), but locks diff logic into one consumer. Server-side diff is reusable and keeps the client thin.
- **Single-phase API (like Relocation):** Would mean the diff is only visible after execution, removing the confirmation safety net. The preview step gives the Kleiderwart a chance to catch mistakes.
- **Different step order (scan-first):** The location is the primary decision. Scan-first would require backfilling the location after scanning, which is confusing.

