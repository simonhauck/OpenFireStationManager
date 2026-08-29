
# ADR-0004: Relaxed Checkout endpoint for return-only clothing operations

**Status:** Accepted
**Date:** 2026-06-03

## Context

The existing `POST /api/clothing/checkouts` supports one flow: take items → PERSONAL, optionally return items PERSONAL → WAESCHE (the "Tauschen" exchange). Users need two additional return-only flows:
- "Klamotten in die Wäsche geben" (PERSONAL → WAESCHE, no take items)
- "Klamotten zurück in den Pool geben" (PERSONAL → POOL, no take items)

The current endpoint constrains: `targetLocationId` must be PERSONAL, `returnLocationId` must be WAESCHE, all return items must be at the PERSONAL `targetLocationId`. These constraints block the new flows.

## Decision

Reuse `POST /api/clothing/checkouts` with relaxed validation:
- `targetLocationId` becomes nullable. When set, it must be PERSONAL (existing take-item flow). When null, there are no take items — return items move directly to `returnLocationId`.
- `returnLocationId` now accepts WAESCHE or POOL (was: only WAESCHE).
- Return items may originate from different PERSONAL locations (the same-location check is removed).
- Movement reason `RETURN` covers both PERSONAL → WAESCHE and PERSONAL → POOL. The reason documents *what the user did* (returned clothing), not *where* it went.
- The endpoint rejects take+return both empty (unchanged).
- The endpoint rejects `targetLocationId = null` with non-empty `takeItemIds`.

## Consequences

- No new endpoint required. All three flows (exchange, wash-return, pool-return) use one API contract.
- `RETURN` movement records now may have WAESCHE or POOL as target. This is discoverable via the batch context (same `batchId` links CHECKOUT and RETURN rows together for exchange flows; return-only flows have only RETURN rows).
- Frontend must regenerate OpenAPI bindings after schema change (`./update-api-definition.sh`).

## Alternatives Rejected

- **New `/api/clothing/returns` endpoint:** Would duplicate the atomic batch transaction logic, movement recording, and location visibility checks from `CheckoutService`. Reusing the existing endpoint avoids this duplication and keeps clothing auditing simpler (one code path for all user-facing item movements).
- **Relocation endpoint for pool-return:** Relocation is KLEIDERWART-only. Users must be able to return items without a Kleiderwart present.
