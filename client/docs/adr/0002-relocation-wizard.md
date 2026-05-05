# ADR-0002: Relocation wizard — target-first step order and shared ClothingItemScanner

**Status:** Accepted
**Date:** 2026-05-05

## Context

The Kleiderwart needs a purpose-built flow for physically relocating groups of clothing items between locations. The existing Checkout wizard cannot serve this use case: it is locked to POOL → PERSONAL semantics, requires a firefighter actor, and has a two-phase discrepancy protocol that is not relevant when the Kleiderwart is physically performing a bulk move.

A new Umlagerung (relocation) wizard is added at `/pool-klamotten/relocation`.

## Decision

### Step order: target-first, 4 steps

1. **Pick target** — searchable `TouchCombobox` over all locations (no type restriction)
2. **Scan items** — shared `ClothingItemScanner` component
3. **Review** — item count, item list, target location name
4. **Success** — items moved count, target name, countdown redirect to `/pool-klamotten`

Target-first was chosen (rather than scan-first) because:
- Knowing the destination before scanning avoids ambiguity and operator error
- It mirrors the mental model: "I want to move items *to X*, now let me select what goes there"
- On a tablet, the combobox for location selection is the most deliberate action; making it first forces the operator to commit to a destination

### Shared ClothingItemScanner component

The item-scanning interaction (barcode input auto-focused on mount, HID scanner fires Enter on scan, typeahead combobox fallback, silent duplicate guard, per-item remove button) is extracted into `clothing/components/shared/ClothingItemScanner`.

Interface:
- `items: ResolvedClothingItem[]` — the current list (parent owns state)
- `onItemResolved: (item: ResolvedClothingItem) => void` — called for new non-duplicate items
- `onRemoveItem: (itemId: number) => void` — called on remove button click
- `renderItemBadge?: (item: ResolvedClothingItem) => ReactNode` — render prop for workflow-specific badges (used by Checkout for the "Nicht in Pool" warning)

The component is stateless with respect to the item list; the parent wizard owns list state. Duplicate detection is done inside the component against the `items` prop.

The Checkout wizard's `StepItemScanner` is refactored to use `ClothingItemScanner`. Checkout-specific logic (discrepancy dialog) remains in `CheckoutPage.tsx` and intercepts `onItemResolved` to show the dialog before calling `addItem`.

### No discrepancy protocol

Umlagerung has no discrepancy detection. The Kleiderwart is physically holding the items and moving them; the source location is inferred per item from its current `locationId` in the database. There is nothing to disagree with.

### Role guard

The route is role-guarded to `KLEIDERWART` via the existing `RoleGuard` component. The entry point button ("Umlagerung starten") on the Pool Klamotten page is rendered conditionally only for users with the `KLEIDERWART` or `ADMIN` role, using the `meQuery` result.

### State machine

`useRelocationWizard` owns the wizard state. Steps are encoded as `1 | 2 | 3 | 4`. The reducer handles:
- `SELECT_TARGET` → step 2
- `ADD_ITEM` → appends item (no-op for duplicates)
- `REMOVE_ITEM` → removes item by ID
- `ADVANCE_TO_REVIEW` → step 3
- `SUBMIT_OK` → step 4, stores batchId
- `GO_BACK` → previous step
- `RESET` → initial state

## Consequences

- The item-scanning UX is consistent between Checkout and Umlagerung — operators learn one interaction pattern.
- The `ClothingItemScanner` component is stable and reusable; future scanning flows can adopt it without code duplication.
- Checkout behaviour is preserved; the refactoring of `StepItemScanner` is covered by the existing Playwright checkout spec.

## Alternatives Rejected

- **Scan-first step order:** The target location is the primary decision in a relocation. Scan-first would require changing the target after scanning, which is confusing.
- **Sub-routes for each step:** The wizard is a single transaction. Browser back exits the wizard intentionally (same decision as Checkout, ADR-0001).
- **Keeping item scanner logic duplicated:** Would diverge over time and lead to UX inconsistencies. The extraction investment is small and the reuse benefit is clear.
