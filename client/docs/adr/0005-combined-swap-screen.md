
# ADR-0005: Combined Ausgabe/Rückgabe swap screen with location-based auto-routing

**Status:** Accepted
**Date:** 2026-10-10

## Context

User feedback in #321: the checkout wizard's two scanning steps — "Kleidung scannen" (take new clothing) and "Rückgabe wählen" (return old clothing) — were not clear about when to scan new items and when to scan old ones. The issue proposed stronger copy and per-step hints as one direction, while leaving the door open for a combined interaction.

The immediately preceding change (#323, PR #333) had already rebuilt the return step as live, type-match **suggestions** plus per-item **overrides** (`RECONCILE_SUGGESTED_RETURNS`), a model that keeps user choices while the locker contents and takes keep changing. That model is the state machine a combined screen needs.

## Decision

Steps 2 and 3 of the Tauschen wizard are merged into one **combined Ausgabe/Rückgabe screen**. The wizard becomes: pick target PERSONAL → combined swap screen → (if returns) pick WAESCHE → review → submit/success. The API is unchanged: still one `POST /api/clothing/checkouts` with both item lists.

### Location-based auto-routing

A scanned, searched or selected item is routed by its **recorded location** against the target Standort chosen in step 1:

- Recorded at the target Standort → return candidate; it is selected in the right-hand **Rückgabe** column.
- Recorded anywhere else (POOL, another PERSONAL Standort, WAESCHE, nowhere) → left-hand **Ausgabe** column.

The user never chooses a scanning phase; the app sorts, and the move actions correct it.

### The two columns

- **Ausgabe (left)** — the take list. Rows show an inline origin badge for non-POOL origins (`Standort: …`) or `Kein Standort` when unset, plus a **"Zurückgeben"** action (force return) and the existing remove action.
- **Rückgabe (right)** — the full contents of the target Standort with a per-row checkbox, exactly the inventory the old return step listed, and any forced returns from the left. Type-match auto-selection (ADR-0001; type only, size ignored) now applies live on the same screen.
- Unticking a locker row means **keep it** (no movement is recorded). Unticking a forced return puts the item back into Ausgabe. Explicit actions are overrides in the #323 sense: they survive re-reconciliation and remounting.
- Continue is enabled while either side has content, so a return-only batch can run through the swap flow.
- Changing the Standort still clears the return selection and overrides; takes survive.

### Badge instead of dialog

The "Kleidungsstück nicht im Pool" AlertDialog is removed. The recorded location of a mismatched item is shown inline on its row, and the move action is the correction. No blocking confirmation is needed once routing is automatic.

### Scope

Only the Tauschen flow changes. The return-only routes (`/pool-clothing/return`) keep their current shape, including the any-locker picker. The right column is anchored to the one target Standort; returning an item recorded elsewhere is expressed by scanning it and pressing "Zurückgeben".

## Consequences

-

# 321's ambiguity disappears: there is no phase to misunderstand, and the copy ("die App sortiert automatisch") describes what actually happens.

- The modal interruption is gone; discrepancy visibility is inline and non-blocking.
- Step 2 is denser than either old step. On narrow screens the columns stack (Astryx `Grid` auto-fit); the tablet layout is two columns.
- The 5-step order revises ADR-0001's 6-step order; ADR-0001's type-match auto-toggle rule still holds and now runs live.
- Return-only operations can drift into the swap flow, making the dedicated return buttons convenience shortcuts rather than the only path.

## Alternatives rejected

- **Copy and hint fixes on the two existing steps** (the other direction in #321): keeps the scan-phase decision with the user, which is the root of the confusion.
- **Tabs (Ausgabe/Rückgabe) instead of side-by-side columns**: hides one side, losing both "see everything at this location" and the immediate visual feedback of where a scanned item landed.
- **Right column showing only selected returns**: would hide the locker inventory the return step exists to expose.
- **Keeping the discrepancy dialog**: redundant once routing is automatic and the origin is visible inline. The correction is a move, not a confirmation.
- **Suggestions only after leaving the scan step**: incompatible with a single step; live suggestions are also what the #323 override model was built to tolerate.
